// Copyright 2021 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import React, { useContext } from "react";
import { Menu, Button } from "semantic-ui-react";
import { Link } from "react-router-dom";
import AppContext from "../context/AppContext";

function TopMenu() {
  const { cart } = useContext(AppContext);

  return (
    <div style={divStyle}>
      <Menu fixed="top" stackable borderless inverted style={menuStyle}>
        <Menu.Item header>
          <Link to="/">
            <Button
              circular
              color="yellow"
              icon="world"
            />
          </Link>
        </Menu.Item>
        <Menu.Item position="right">
          <Link to={"/Checkout"}>
            <Button
              color="yellow"
              icon="cart"
              label={"" + cart.items.length}
              labelPosition="right"
              style={cartStyle}
            />
          </Link>
        </Menu.Item>
      </Menu>
    </div>
  );
}

export default TopMenu;

const menuStyle = {
  background: "#232f3e",
};

const divStyle = {
  paddingTop: "6em",
};

const cartStyle = {
  marginRight: "1em",
};
