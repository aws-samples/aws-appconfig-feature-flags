// Copyright 2021 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import React, { useState, useContext } from "react";
import {
  Button,
  Grid,
  Icon,
  Image,
  Header,
  Card,
  Divider,
  Dropdown,
} from "semantic-ui-react";
import { useParams } from "react-router-dom";
import styled from "styled-components";

import AppContext from "../context/AppContext";

import InitState from "./InitState";
import TopMenu from "../components/TopMenu";
import { formatCurrency } from "../services/currency";
import Feature from "../components/Feature";
import { Product as ProductType } from "../types";

const Product: React.FC = (): React.JSX.Element => {
  const [quantity, setQuantity] = useState<number>(1);
  const [isAdding, setIsAdding] = useState<boolean>(false);
  const { id } = useParams<{ id: string }>();

  const { products, addToCart, getTotalItemsInCart } = useContext(AppContext);

  const _product = products.filter(function (el: ProductType) {
    return el.id === parseInt(id || '0');
  });

  let product: ProductType | null = null;
  if (_product.length === 1) product = _product[0] || null;

  const quant = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((item) => {
    return { key: item, value: item, text: item };
  });

  function addItem(product: ProductType, quantity: number): void {
    console.log(`Adding ${quantity} of product ${product.itemName} to cart`);
    setIsAdding(true);
    addToCart(product, quantity);
    
    // Add a small delay to show feedback
    setTimeout(() => {
      setIsAdding(false);
    }, 300);
  }

  if (!product) {
    return (
      <div style={styles}>
        <InitState />
        <TopMenu cartItemCount={getTotalItemsInCart()} />
        <div>Product not found</div>
      </div>
    );
  }

  return (
    <div style={styles}>
      <InitState />
      <TopMenu cartItemCount={getTotalItemsInCart()} />
      <Grid columns={3} stackable>
        <Grid.Row>
          <Grid.Column>
            <Image src={`/images/products/${product.itemImage}`} />
          </Grid.Column>
          <Grid.Column width={7}>
            <Header as="h2">{product.itemName}</Header>
            <InfoText>{product.itemDesc}</InfoText>
            <Divider />
            <Grid columns={3}>
              <Grid.Column width={1} style={{ marginRight: "5px" }}>
                Price:{' '}
              </Grid.Column>
              <Grid.Column width={2} textAlign="left">
                <PriceText>{formatCurrency(product.itemPrice)}</PriceText>
              </Grid.Column>
            </Grid>
            <Feature flagName="show_stock">
              <StockText>{product.itemStock} items in stock</StockText>
            </Feature>
          </Grid.Column>
          <Grid.Column width={3}>
            <Card fluid>
              <Card.Content>
                <div>
                  I'd like{" "}
                  <Dropdown
                    floating
                    inline
                    options={quant}
                    defaultValue={1}
                    onChange={(_e, { value }) => setQuantity(value as number)}
                  />{" "}
                  item, please.
                </div>
                <Divider />
                <Button
                  icon
                  labelPosition="left"
                  color="orange"
                  fluid
                  loading={isAdding}
                  onClick={() => addItem(product!, quantity)}
                >
                  <Icon name="cart" />
                  <ButtonStyle>{isAdding ? 'Adding...' : 'Add to Cart'}</ButtonStyle>
                </Button>
                <Divider />
                <Button icon labelPosition="left" color="grey" fluid>
                  <Icon name="list" />
                  <ButtonStyle>Add to Wish List</ButtonStyle>
                </Button>
              </Card.Content>
            </Card>
          </Grid.Column>
        </Grid.Row>
      </Grid>
    </div>
  );
};

export default Product;

const styles: React.CSSProperties = {
  marginLeft: "1em",
  marginRight: "1em",
  marginTop: "2em",
};

const PriceText = styled.div`
  font-size: 14pt;
  color: #b12704;
`;

const StockText = styled.div`
  padding-top: 1em;
  padding-bottom: 1em;
  font-size: 14pt;
  color: #008a00;
`;

const InfoText = styled.div`
  font-size: 10pt;
`;

const ButtonStyle = styled.div`
  padding-left: 2em;
`;