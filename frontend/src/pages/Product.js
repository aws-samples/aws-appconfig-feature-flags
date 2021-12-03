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
import styled from "styled-components";

import AppContext from "../context/AppContext";

import InitState from "./InitState";
import TopMenu from "../components/TopMenu";
import { formatCurrency } from "../services/currency";
import Feature from "../components/Feature";

function Product(props) {
  const [quantity, setQuantity] = useState(1);

  const { items, addItemToCart } = useContext(AppContext);

  const { params } = props.match;

  var _product = items.filter(function (el) {
    return el.id === parseInt(params.id);
  });

  var product = "";
  if (_product.length === 1) product = _product[0];

  var quant = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((item) => {
    return { key: item, value: item, text: item };
  });

  function addItem(product, quantity) {
    addItemToCart(product, quantity);
  }

  return (
    <div style={styles}>
      <InitState />
      <TopMenu />
      <Grid columns={3} stackable>
        <Grid.Row>
          <Grid.Column>
            <Image src={"/images/products/" + product.itemImage} />
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
            <Feature name="show_stock">
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
                    onChange={(e, { value }) => setQuantity(value)}
                  />{" "}
                  item, please.
                </div>
                <Divider />
                <Button
                  icon
                  labelPosition="left"
                  color="orange"
                  fluid
                  onClick={() => addItem(product, quantity)}
                >
                  <Icon name="cart" />
                  <ButtonStyle>Add to Cart</ButtonStyle>
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
}

export default Product;

const styles = {
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
