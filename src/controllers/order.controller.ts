import express from "express";
import { getModels } from "../models/connections.js";
import { Types } from "mongoose";

// GET /orders - Obtener todas las órdenes
export const getAllOrders = async (
  req: express.Request,
  res: express.Response
): Promise<void> => {
  try {
    const { Orden } = getModels();
    const { userId, status } = req.query;

    // Only filter by status if provided; otherwise return all orders
    const filters: any = {};
    if (status !== undefined) {
      filters.status = status === "true";
    }
    if (userId && Types.ObjectId.isValid(userId as string)) {
      filters.userId = userId;
    }

    const orders = await Orden.find(filters);
    res.json({ orders });
  } catch (error) {
    console.error("Error al obtener órdenes:", error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
};

// GET /orders/:orderId - Obtener orden por ID
export const getOrderById = async (
  req: express.Request,
  res: express.Response
): Promise<void> => {
  try {
    const { orderId } = req.params;
    const { Orden } = getModels();

    if (!Types.ObjectId.isValid(orderId)) {
      res.status(400).json({ message: "ID de orden inválido" });
      return;
    }

    const order = await Orden.findById(orderId);
    if (!order) {
      res.status(404).json({ message: "Orden no encontrada" });
      return;
    }

    res.json({ order });
  } catch (error) {
    console.error("Error al obtener orden:", error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
};

// POST /orders - Crear nueva orden
export const createOrder = async (
  req: express.Request,
  res: express.Response
): Promise<void> => {
  try {
    const { userId, products } = req.body;
    const { Orden, Producto, User } = getModels();

    // Validaciones básicas
    if (
      !userId ||
      !Types.ObjectId.isValid(userId) ||
      !Array.isArray(products) ||
      products.length === 0
    ) {
      res
        .status(400)
        .json({ message: "UserId válido y productos son requeridos" });
      return;
    }

    // Verificar usuario existe
    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ message: "Usuario no encontrado" });
      return;
    }

    let total = 0;
    const orderProducts = [];

    // Procesar productos
    for (const { productId, quantity } of products) {
      if (!Types.ObjectId.isValid(productId) || !quantity || quantity <= 0) {
        res.status(400).json({ message: "Datos de producto inválidos" });
        return;
      }

      const product = await Producto.findById(productId);
      if (!product || !product.status || product.Quantity < quantity) {
        res.status(400).json({
          message: `Producto no disponible o stock insuficiente: ${
            product?.name || productId
          }`,
        });
        return;
      }

      // Actualizar stock
      await Producto.findByIdAndUpdate(productId, {
        $inc: { Quantity: -quantity },
      });

      total += product.price * quantity;
      orderProducts.push({
        productId,
        quantity,
        price: product.price,
      });
    }

    // Crear orden
    const newOrder = new Orden({
      userId,
      products: orderProducts,
      subtotal: total,
      total,
      status: true,
      createdAt: new Date(),
    });
    const savedOrder = await newOrder.save();

    res.status(201).json({
      message: "Orden creada exitosamente",
      order: savedOrder,
    });
  } catch (error) {
    console.error("Error al crear orden:", error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
};

// PATCH /orders/:orderId/status - Actualizar estado de orden
export const updateOrderStatus = async (
  req: express.Request,
  res: express.Response
): Promise<void> => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;
    const { Orden } = getModels();

    if (!Types.ObjectId.isValid(orderId) || typeof status !== "boolean") {
      res.status(400).json({ message: "ID de orden o status inválido" });
      return;
    }

    const updatedOrder = await Orden.findByIdAndUpdate(
      orderId,
      { status },
      { new: true }
    );
    if (!updatedOrder) {
      res.status(404).json({ message: "Orden no encontrada" });
      return;
    }

    res.json({
      message: "Estado actualizado exitosamente",
      order: updatedOrder,
    });
  } catch (error) {
    console.error("Error al actualizar orden:", error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
};

// DELETE /orders/:orderId - Cancelar orden
export const cancelOrder = async (
  req: express.Request,
  res: express.Response
): Promise<void> => {
  try {
    const { orderId } = req.params;
    const { Orden, Producto } = getModels();

    if (!Types.ObjectId.isValid(orderId)) {
      res.status(400).json({ message: "ID de orden inválido" });
      return;
    }

    const order = await Orden.findById(orderId);
    if (!order) {
      res.status(404).json({ message: "Orden no encontrada" });
      return;
    }

    if (!order.status) {
      res.status(400).json({ message: "La orden ya está cancelada" });
      return;
    }

    // Restaurar stock
    for (const item of order.products) {
      await Producto.findByIdAndUpdate(item.productId, {
        $inc: { Quantity: item.quantity },
      });
    } // Cancelar orden
    const cancelledOrder = await Orden.findByIdAndUpdate(
      orderId,
      { status: false, deleteAt: new Date() },
      { new: true }
    );

    res.json({
      message: "Orden cancelada exitosamente",
      order: cancelledOrder,
    });
  } catch (error) {
    console.error("Error al cancelar orden:", error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
};

// GET /orders/user/:userId - Obtener órdenes por usuario
export const getOrdersByUserId = async (
  req: express.Request,
  res: express.Response
): Promise<void> => {
  try {
    const { userId } = req.params;
    const { status } = req.query;
    const { Orden } = getModels();

    if (!Types.ObjectId.isValid(userId)) {
      res.status(400).json({ message: "ID de usuario inválido" });
      return;
    }

    const filters: any = { userId };
    if (status !== undefined) {
      filters.status = status === "true";
    }
    const orders = await Orden.find(filters).sort({ createdAt: -1 });

    res.json({ orders });
  } catch (error) {
    console.error("Error al obtener órdenes del usuario:", error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
};
