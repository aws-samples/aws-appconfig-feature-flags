// Copyright 2021 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import { useContext } from "react";
import AppContext from "../context/AppContext";

const Feature = ({ name, children }) => {
  const { flags } = useContext(AppContext);
  const feature=flags[0][name];

  if (feature) {
    if (feature.enabled) {
      return children;
    }
  }

  return null;
};

export default Feature;
