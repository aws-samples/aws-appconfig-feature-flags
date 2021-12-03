// Copyright 2021 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import React from 'react'
import { Container, Header } from 'semantic-ui-react'

import InitState from './pages/InitState'
import TopMenu from './components/TopMenu'
import ItemTable from './components/ItemTable'

import './App.css'

function App() {
    return (
        <div style={styles}>
            <InitState/>
            <TopMenu />
            <Container text style={{ marginBottom: '1em' }}>
                <Header as='h1' style={{ textAlign: 'center' }}>Feature Flag Store</Header>
            </Container>
            <Container style={{ marginTop: '2em' }}>
                <ItemTable type='echo' />
            </Container>
        </div>
    );
}

export default App;

const styles = {
    marginLeft: '1em',
    marginRight: '1em'
}