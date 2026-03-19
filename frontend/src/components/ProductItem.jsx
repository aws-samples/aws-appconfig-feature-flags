// Copyright 2021 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import React from "react";
import { Grid, Image, Container, Icon } from "semantic-ui-react";
import { Link } from "react-router-dom";
import styled from "styled-components";
import { formatCurrency } from "../services/currency";

function ProductItem(props) {
  var stars;
  var itemStars = Math.floor(Math.random() * 6);
  var totalChits = 0;
  var i;

  for (i = 0; i < 5; i++) {
    if (i <= itemStars - 1) {
      stars = [stars, <Icon color="yellow" name="star" key={Math.random()} />];
      totalChits++;
    }
  }
  for (i = 0; i < 5 - totalChits; i++) {
    stars = [
      stars,
      <Icon color="yellow" name="star outline" key={Math.random()} />,
    ];
  }

  return (
    <Grid.Column>
      <Grid>
        <Grid.Row>
          <Grid.Column>
            <Link to={"/Product/" + props.item.id}>
              <Image src={"/images/products/" + props.item.itemImage} centered />
            </Link>
            <Container style={{ paddingLeft: "2em" }}>
              <LinkStyle>
                <Link to={"/Product/" + props.item.id}>
                  {props.item.itemName}
                </Link>
              </LinkStyle>
              <StoreText>{props.item.itemDesc}</StoreText>
              {stars}
              <Grid columns={2}>
                <Grid.Column width={3}>
                  <PriceText>{formatCurrency(props.item.itemPrice)}</PriceText>
                </Grid.Column>
              </Grid>
              {props.item.itemStock > 0 && (
                <StockText>{props.item.itemStock} in stock</StockText>
              )}
            </Container>
          </Grid.Column>
        </Grid.Row>
      </Grid>
    </Grid.Column>
  );
}

export default ProductItem;

const LinkStyle = styled.div`
  font-size: 1em;
`;

const StoreText = styled.div`
  font-size: 10pt;
  padding-top: 1em;
`;

const PriceText = styled.div`
  font-size: 10pt;
  padding-top: 1em;
  color: #b12704;
`;

const StockText = styled.div`
  font-size: 10pt;
  padding-top: 1em;
  color: #008a00;
`;
