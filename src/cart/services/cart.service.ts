import { Injectable } from '@nestjs/common';

import { Cart } from '../models';

import { InjectClient } from 'nest-postgres';
import { Client } from 'pg';

@Injectable()
export class CartService {
  constructor(@InjectClient() private readonly pg: Client) {}

  async findByUserId(): Promise<Cart> {
    const carts = await this.pg.query(`SELECT * FROM carts`);

    console.log('findByUserId carts', carts);

    if (!carts.rows?.[0]?.id) {
      return null;
    }

    const cartItems = await this.pg.query(
      `SELECT * FROM cart_items WHERE cart_id=$1`,
      [carts.rows[0].id],
    );

    console.log('findByUserId cartItems', cartItems);

    const items = cartItems.rows.map(cartItem => ({
      product: { ...cartItem },
      count: cartItem.count,
    }));


    const cart = {
      id: carts.rows[0].id,
      items,
    };

    console.log('findByUserId cart', cart);

    return cart;
  }

  async createByUserId(): Promise<Cart> {
    const date = `${new Date().getFullYear()}-${new Date().getMonth()}-${new Date().getDate()}`;
    const carts = await this.pg.query(
      `INSERT INTO carts (created_at, updated_at) VALUES ($1, $2) RETURNING *`,
      [date, date],
    );

    console.log('createByUserId cart', carts);

    const userCart = {
      id: carts.rows[0].id,
      items: [],
    };

    console.log('createByUserId userCart', userCart);

    return userCart;
  }

  async findOrCreateByUserId(): Promise<Cart> {
    const userCart = await this.findByUserId();

    console.log('findOrCreateByUserId userCart', userCart);

    if (userCart) {
      return userCart;
    }

    const newCart = await this.createByUserId();

    console.log('findOrCreateByUserId newCart', newCart);

    return newCart;
  }

  async updateByUserId({ product, count }: any): Promise<Cart> {
    const { id }: Cart = await this.findOrCreateByUserId();

    console.log('updateByUserId id product', id, product);

    const existing = await this.pg.query(
      `SELECT * FROM cart_items WHERE product_id=$1 AND cart_id=$2`,
      [product.id, id],
    );

    console.log('updateByUserId existing', existing);

    if (count > existing.rows?.[0]?.count || !existing.rows?.[0]) {
      if (existing.rows[0]) {
        console.log('UPDATE');
        await this.pg.query(
          `UPDATE cart_items SET count=$3 WHERE product_id=$1 AND cart_id=$2`,
          [product.id, id, count],
        );
      } else {
        console.log('INSERT');
        await this.pg.query(
          `INSERT INTO cart_items (product_id, cart_id, count, title, description, price) VALUES($1, $2, $3, $4, $5, $6)`,
          [product.id, id, count, product.title, product.description, product.price],
        );
      }
    } else if (count === 0 && existing.rows?.[0]?.count > count) {
      await this.pg.query(`DELETE FROM cart_items WHERE product_id=$1`, [
        product.id,
      ]);
    } else {
      await this.pg.query(
        `UPDATE cart_items SET count = $1 WHERE cart_id = $2 AND product_id=$3`,
        [count, id, product.id],
      );
    }

    const cartItems = await this.pg.query(
      `SELECT * FROM cart_items`,
    );

    console.log('updateByUserId createdCartItems', cartItems);

    // const updatedCart = {
    //   id,
    //   ...rest,
    //   items: createdCartItems.rows.map(cartItem => ({
    //     product: { ...cartItem },
    //     count: cartItem.count,
    //   })),
    // };

    const items = cartItems.rows.map(cartItem => ({
      product: { ...cartItem },
      count: cartItem.count,
    }));


    const cart = {
      id,
      items,
    };

    console.log('updateByUserId updatedCart', cart);

    return cart;
  }

  async removeByUserId(): Promise<void> {
  
    console.log('removeByUserId' );

    await this.pg.query(`DELETE FROM carts`);
  }
}
