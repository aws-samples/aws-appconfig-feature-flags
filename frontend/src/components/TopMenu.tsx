// Copyright 2021 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import React, { useContext } from "react";
import { Menu, Button } from "semantic-ui-react";
import { Link } from "react-router-dom";
import AppContext from "../context/AppContext";
import { TopMenuProps } from "../types";

const TopMenu: React.FC<TopMenuProps> = ({ cartItemCount }): React.JSX.Element => {
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
          <Link to={"/checkout"}>
            <Button
              color="yellow"
              icon="cart"
              label={String(cartItemCount || cart.length)}
              labelPosition="right"
              style={cartStyle}
            />
          </Link>
        </Menu.Item>
      </Menu>
    </div>
  );
};

export default TopMenu;

const menuStyle: React.CSSProperties = {
  background: "#232f3e",
};

const divStyle: React.CSSProperties = {
  paddingTop: "6em",
};

const cartStyle: React.CSSProperties = {
  marginRight: "1em",
};