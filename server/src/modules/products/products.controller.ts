import { Request, Response, NextFunction } from 'express';
import { sendSuccess } from '../../utils/apiResponse';
import {
  createProductSchema,
  updateProductSchema,
  productQuerySchema,
  addMovementSchema,
} from './products.validation';
import * as productService from './products.service';

export async function createProductHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const input = createProductSchema.parse(req.body);
    const product = await productService.createProduct(input);
    sendSuccess(res, product, 'Product created successfully.', 201);
  } catch (error) {
    next(error);
  }
}

export async function getProductsHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const query = productQuerySchema.parse(req.query);
    const result = await productService.getProducts(query);
    sendSuccess(res, result.products, 'Products retrieved.', 200, result.meta);
  } catch (error) {
    next(error);
  }
}

export async function getProductByIdHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const product = await productService.getProductById(req.params.id as string);
    sendSuccess(res, product, 'Product detail retrieved.');
  } catch (error) {
    next(error);
  }
}

export async function updateProductHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const input = updateProductSchema.parse(req.body);
    const product = await productService.updateProduct(req.params.id as string, input);
    sendSuccess(res, product, 'Product updated successfully.');
  } catch (error) {
    next(error);
  }
}

export async function addMovementHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const input = addMovementSchema.parse(req.body);
    const movement = await productService.addStockMovement(req.params.id as string, req.user!.userId, input);
    sendSuccess(res, movement, 'Stock movement recorded successfully.', 201);
  } catch (error) {
    next(error);
  }
}
