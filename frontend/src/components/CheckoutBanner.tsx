// Copyright 2021 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import React from "react";
import { Link } from "react-router-dom";
import { Grid, Header, Image } from "semantic-ui-react";
import styled from "styled-components";

interface CheckoutBannerProps {
  quantity: number;
}

const CheckoutBanner: React.FC<CheckoutBannerProps> = ({ quantity }): React.JSX.Element => {
  return (
    <Grid columns={2} style={topBanner}>
      <Grid.Row>
        <Grid.Column width={2}>
          <Link to="/">
            <Image src="" style={logoStyle} />
          </Link>
        </Grid.Column>
        <Grid.Column
          width={12}
          verticalAlign="middle"
          textAlign="center"
          style={headerStyle}
        >
          <Header as="h1" textAlign="center">
            Checkout (<QuantityText>{quantity}</QuantityText>)
          </Header>
        </Grid.Column>
      </Grid.Row>
    </Grid>
  );
};

export default CheckoutBanner;

const topBanner: React.CSSProperties = {
  background: "url(/images/header-bkg.png)",
  borderColor: "#DDD",
  borderStyle: "solid",
  borderWidth: "0 0 1px 0",
  height: "73px",
};

const logoStyle: React.CSSProperties = {
  marginRight: "1.5em",
  marginLeft: "4em",
  marginTop: "5px",
};

const headerStyle: React.CSSProperties = {
  marginTop: "5px",
};

const QuantityText = styled.a`
  font-size: 12pt;
  vertical-align: middle;
`;