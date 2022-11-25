import { Controller, Get, Delete, Put, Body, Req, Post, UseGuards, HttpStatus } from '@nestjs/common';

// import { BasicAuthGuard, JwtAuthGuard } from '../auth';
import { OrderService } from '../order';
// import { AppRequest, getUserIdFromRequest } from '../shared';

import { calculateCartTotal } from './models-rules';
import { CartService } from './services';

@Controller('profile/cart')
export class CartController {
  constructor(
    private cartService: CartService,
    private orderService: OrderService
  ) { }

  @Get()
  async findUserCart() {
    console.log('findUserCart cart--------------')

    const cart = await this.cartService.findOrCreateByUserId();

    console.log('findUserCart cart', cart)
  
    const data = cart.items.map(i=>({
      product: {
        price: i.product.price,
        title: i.product.title,
        description: i.product.description,
        id: i.product.product_id
      },
      count: i.count
    })) 

    console.log('findUserCart data', data)
    // return {
    //   statusCode: HttpStatus.OK,
    //   message: 'OK',
    //   data
    // }
    return data;
  }

  @Put()
  async updateUserCart(@Body() body) {
    console.log('updateUserCart body', body)
    const cart = await this.cartService.updateByUserId(body)

    console.log('updateUserCart cart', cart)

    return {
      statusCode: HttpStatus.OK,
      message: 'OK',
      data: {
        cart,
        total: calculateCartTotal(cart),
      }
    }
  }

  @Delete()
  async clearUserCart() {
    await this.cartService.removeByUserId();

    console.log('clearUserCart')

    return {
      statusCode: HttpStatus.OK,
      message: 'OK',
    }
  }

  @Post('checkout')
  async checkout (@Body() body) {
    const cart = await this.cartService.findByUserId();

    console.log('checkout cart', cart)

    if (!(cart && cart.items.length)) {
      const statusCode = HttpStatus.BAD_REQUEST;

      return {
        statusCode,
        message: 'Cart is empty',
      }
    }

    const { id: cartId, items } = cart;
    const total = calculateCartTotal(cart);
    const order = this.orderService.create({
      ...body, // TODO: validate and pick only necessary data
      cartId,
      items,
      total,
    });
    await this.cartService.removeByUserId();

    return {
      statusCode: HttpStatus.OK,
      message: 'OK',
      data: { order }
    }
  }
}
