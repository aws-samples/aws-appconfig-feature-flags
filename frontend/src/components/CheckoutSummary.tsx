// Copyright 2021 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import React from "react";
import { Grid, Divider, Input, Segment, Button } from "semantic-ui-react";
import styled from "styled-components";
import { formatCurrency } from "../services/currency";
import Feature from "../components/Feature";

interface CheckoutSummaryProps {
  total: number;
  placedOrder: boolean;
  onOrder: () => void;
  onCardUpdate: (data: { value: string }) => void;
}

const CheckoutSummary: React.FC<CheckoutSummaryProps> = ({ 
  total, 
  placedOrder, 
  onOrder, 
  onCardUpdate 
}): React.JSX.Element => {
  const featureTitle = 'Mobile payment';

  return (
    <div>
      <Grid columns={3}>
        <Grid.Row>
          <Grid.Column width={1}>
            <BoldText>1</BoldText>
          </Grid.Column>
          <Grid.Column width={4}>
            <BoldText>Shipping address</BoldText>
          </Grid.Column>
          <Grid.Column width={7}>
            <NormalText>
              Givenname Familyname
              <br />
              Street
              <br />
              City, State 12345
              <br />
              Country
            </NormalText>
          </Grid.Column>
        </Grid.Row>
        <Divider />
        <Grid.Row>
          <Grid.Column width={1}>
            <BoldText>2</BoldText>
          </Grid.Column>
          <Grid.Column width={4}>
            <BoldText>Payment method</BoldText>
          </Grid.Column>
          <Grid.Column width={7} verticalAlign="middle">
            <Grid columns={3}>
              <Grid.Column width={2}>
                <input type="radio" value="amex" name="card" />
              </Grid.Column>
              <Grid.Column width={2}>
                <img src="/images/misc/card.png" alt="" />
              </Grid.Column>
              <Grid.Column width={10}>
                <b>Debit card</b>
              </Grid.Column>
            </Grid>
            <Feature flagName="mobile_payment">
              <Grid columns={2}>
                <Grid.Column width={2}>
                  <input type="radio" value="amex" name="card" />
                </Grid.Column>
                <Grid.Column width={2}>
                  <img src="/images/misc/mobile.png" alt="" />
                </Grid.Column>
                <Grid.Column width={10}>
                  <b>{featureTitle}</b>
                </Grid.Column>
              </Grid>
            </Feature>
            <br />
            <Input
              fluid
              icon="credit card"
              iconPosition="left"
              placeholder="Payment details..."
              onChange={(_event, data) => onCardUpdate(data)}
            />
          </Grid.Column>
        </Grid.Row>
        <Grid.Row>
          <Grid.Column width={1}></Grid.Column>
          <Grid.Column width={15}>
            <Segment>
              <Grid columns={2}>
                <Grid.Column width={4}>
                  <Button
                    color="orange"
                    loading={placedOrder}
                    onClick={onOrder}
                  >
                    Place your order
                  </Button>
                </Grid.Column>
                <Grid.Column width={8} verticalAlign="middle">
                  <TotalText>Order total: {formatCurrency(total)}</TotalText>
                </Grid.Column>
              </Grid>
            </Segment>
          </Grid.Column>
        </Grid.Row>
      </Grid>
    </div>
  );
};

export default CheckoutSummary;

const BoldText = styled.div`
  font-size: 17px;
  font-weight: bold;
`;

const NormalText = styled.div`
  font-size: 1em;
`;

const TotalText = styled.div`
  font-size: 1.2em;
  font-weight: bold;
  color: #b12704;
`;