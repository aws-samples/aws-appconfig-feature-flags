// Copyright 2021 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import React, { useEffect, useContext } from "react";
import { get } from "aws-amplify/api";
import AppContext from "../context/AppContext";
import configData from "../config.json";

function InitState() {
  const { itemCache, flagCache, addItems, cacheItem, addFlags, cacheFlag } =
    useContext(AppContext);

  useEffect(() => {
    if (itemCache < Date.now()) {
      const restOperation = get({
        apiName: "apiendpoint",
        path: "/products",
      });
      restOperation.response
        .then(async (res) => {
          const body = await res.body.json();
          addItems(body);
          cacheItem(Date.now() + 1000 + configData.ITEM_CACHE);
        })
        .catch((error) => {
          console.log(error.response);
        });
    }
  }, [itemCache, addItems, cacheItem]);

  useEffect(() => {
    if (flagCache < Date.now()) {
      const restOperation = get({
        apiName: "apiendpoint",
        path: "/flags",
      });
      restOperation.response
        .then(async (res) => {
          const body = await res.body.json();
          const responseArray = [];
          responseArray.push(body);
          addFlags(responseArray);
          cacheFlag(Date.now() + 1000 + configData.FLAG_CACHE);
        })
        .catch((error) => {
          console.log(error.response);
        });
    }
  }, [flagCache, addFlags, cacheFlag]);

  return <React.Fragment></React.Fragment>;
}

export default InitState;
