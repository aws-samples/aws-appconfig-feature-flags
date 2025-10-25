// Copyright 2021 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import React, { useState, useEffect, useContext } from "react";
import { Grid } from "semantic-ui-react";
import { useNavigate } from "react-router-dom";

import AppContext from "../context/AppContext";

import InitState from "./InitState";
import CheckoutBanner from "../components/CheckoutBanner";
import CheckoutSummary from "../components/CheckoutSummary";
import CheckoutPayment from "../components/CheckoutPayment";

const Checkout: React.FC = (): React.JSX.Element => {
  const [ordering] = useState(false);
  const [totalPurchase, setTotal] = useState(0);
  const [orderComplete, setOrderComplete] = useState(false);
  const navigate = useNavigate();

  const { cart, products, clearCart, getTotalItemsInCart } = useContext(AppContext);

  function handleCardUpdate(_e: { value: string }): void {
    // Card update logic would go here
  }

  function submitOrder(): void {
    setOrderComplete(true);
  }

  useEffect(() => {
    function calculateTotal(): string {
      let total = 0;
      let _item = null;

      cart.map((item) => {
        const _product = products.filter(function (el) {
          return el.id === item.id;
        });

        _product.length === 1 ? (_item = _product[0]) : (_item = null);
        if (_item) {
          total += _item.itemPrice * item.quantity;
        }
        return null;
      });

      setTotal(parseFloat(total.toString()).toFixed(2) as any);
      return parseFloat(total.toString()).toFixed(2);
    }

    calculateTotal();
  }, [cart, products]);

  useEffect(() => {
    if (orderComplete) {
      console.log("Purchase price", totalPurchase);

      clearCart();

      // Navigate to order confirmation page instead of home
      navigate("/ordercomplete");
    }
  }, [orderComplete, navigate, clearCart, totalPurchase]);

  return (
    <div>
      <InitState />
      <CheckoutBanner quantity={getTotalItemsInCart()} />
      <div style={mainDiv}>
        <Grid columns={2}>
          <Grid.Row>
            <Grid.Column floated="left" width={11}>
              <CheckoutSummary
                placedOrder={ordering}
                onCardUpdate={handleCardUpdate}
                onOrder={submitOrder}
                total={totalPurchase}
              />
            </Grid.Column>
            <Grid.Column floated="right" width={5}>
              <CheckoutPayment
                placedOrder={ordering}
                onOrder={submitOrder}
                total={totalPurchase}
              />
            </Grid.Column>
          </Grid.Row>
        </Grid>
      </div>
    </div>
  );
};

export default Checkout;

const mainDiv: React.CSSProperties = {
  marginLeft: "5em",
  marginRight: "1em",
  marginTop: "2em",
};