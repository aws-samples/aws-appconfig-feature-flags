// Copyright 2021 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import React from 'react';
import { Grid, Header, Image, Container, Button, Icon, Segment } from 'semantic-ui-react';
import { Link } from 'react-router-dom';

const PlacedOrder: React.FC = (): React.JSX.Element => {
    return (
        <div>
            <Grid columns={2} style={topBanner}>
                <Grid.Row>
                    <Grid.Column width={2}>
                        <Image src='/images/store-logo.svg' style={logoStyle} />
                    </Grid.Column>
                    <Grid.Column width={12} verticalAlign='middle' textAlign='center' style={headerStyle}>
                        <Header as='h1' textAlign='center'>Order Complete</Header>
                    </Grid.Column>
                </Grid.Row>
            </Grid>
            
            <Container style={containerStyle}>
                <Segment textAlign='center' padded='very'>
                    <Icon name='check circle' size='huge' color='green' />
                    <Header as='h2' style={successHeaderStyle}>
                        Thank you for your order!
                    </Header>
                    <p style={messageStyle}>
                        Your order has been successfully placed and is being processed.
                        You will receive a confirmation email shortly.
                    </p>
                    
                    <div style={buttonContainerStyle}>
                        <Link to='/'>
                            <Button 
                                color='orange' 
                                size='large'
                                icon
                                labelPosition='left'
                            >
                                <Icon name='shop' />
                                Continue Shopping
                            </Button>
                        </Link>
                    </div>
                </Segment>
            </Container>
        </div>
    );
};

export default PlacedOrder;

const topBanner: React.CSSProperties = {
    background: 'url(/images/header-bkg.png)',
    borderColor: '#DDD',
    borderStyle: 'solid',
    borderWidth: '0 0 1px 0',
    height: '73px'
};

const logoStyle: React.CSSProperties = {
    marginRight: '1.5em', 
    marginLeft: '4em', 
    marginTop: '5px'
};

const headerStyle: React.CSSProperties = {
    marginTop: '5px'
};

const containerStyle: React.CSSProperties = {
    marginTop: '3em',
    marginBottom: '3em'
};

const successHeaderStyle: React.CSSProperties = {
    color: '#28a745',
    marginTop: '1em'
};

const messageStyle: React.CSSProperties = {
    fontSize: '1.2em',
    color: '#666',
    marginTop: '1em',
    marginBottom: '2em'
};

const buttonContainerStyle: React.CSSProperties = {
    marginTop: '2em'
};