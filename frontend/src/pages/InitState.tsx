// Copyright 2021 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import React, { useEffect, useContext } from "react";
import AppContext from "../context/AppContext";

const InitState: React.FC = (): React.JSX.Element => {
  const { products, featureFlags, loadProducts, loadFeatureFlags } = useContext(AppContext);

  useEffect(() => {
    // Load products if not already loaded
    if (products.length === 0) {
      loadProducts();
    }
  }, [products.length, loadProducts]);

  useEffect(() => {
    // Load feature flags if not already loaded
    if (Object.keys(featureFlags).length === 0) {
      loadFeatureFlags();
    }
  }, [featureFlags, loadFeatureFlags]);

  return <React.Fragment></React.Fragment>;
};

export default InitState;