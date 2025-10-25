// Copyright 2021 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import React from "react";
import { Grid, Image, Container, Icon } from "semantic-ui-react";
import { Link } from "react-router-dom";
import styled from "styled-components";
import { formatCurrency } from "../services/currency";
import { Product } from "../types";

interface ProductItemProps {
  item: Product;
}

const ProductItem: React.FC<ProductItemProps> = ({ item }): React.JSX.Element => {
  let stars: React.ReactNode[] = [];
  const itemStars = Math.floor(Math.random() * 6);
  let totalChits = 0;
  let i: number;

  for (i = 0; i < 5; i++) {
    if (i <= itemStars - 1) {
      stars.push(<Icon color="yellow" name="star" key={`star-${i}`} />);
      totalChits++;
    }
  }
  
  for (i = 0; i < 5 - totalChits; i++) {
    stars.push(<Icon color="yellow" name="star outline" key={`star-outline-${i}`} />);
  }

  return (
    <Grid.Column>
      <Grid>
        <Grid.Row>
          <Grid.Column>
            <Link to={`/Product/${item.id}`}>
              <Image src={`/images/products/${item.itemImage}`} centered />
            </Link>
            <Container style={{ paddingLeft: "2em" }}>
              <LinkStyle>
                <Link to={`/Product/${item.id}`}>
                  {item.itemName}
                </Link>
              </LinkStyle>
              <StoreText>{item.itemDesc}</StoreText>
              {stars}
              <Grid columns={2}>
                <Grid.Column width={3}>
                  <PriceText>{formatCurrency(item.itemPrice)}</PriceText>
                </Grid.Column>
              </Grid>
              {item.itemStock && item.itemStock > 0 && (
                <StockText>{item.itemStock} in stock</StockText>
              )}
            </Container>
          </Grid.Column>
        </Grid.Row>
      </Grid>
    </Grid.Column>
  );
};

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