// Copyright 2021 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import React, { useContext } from "react";
import { Grid } from "semantic-ui-react";

import ProductItem from "./ProductItem";
import AppContext from "../context/AppContext";

function ItemTable(props) {
  const { items } = useContext(AppContext);

  const productItems = items.map((item) => {
    return <ProductItem item={item} key={item.itemName} />;
  });

  return (
    <Grid stackable divided columns={4}>
      {productItems}
    </Grid>
  );
}

export default ItemTable;
