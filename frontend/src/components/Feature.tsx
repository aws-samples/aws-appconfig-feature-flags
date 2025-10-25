// Copyright 2021 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import React, { useContext } from "react";
import AppContext from "../context/AppContext";
import { featureFlagService } from "../services/featureFlagService";
import { FeatureComponentProps } from "../types";

const Feature: React.FC<FeatureComponentProps> = ({ 
  flagName, 
  children, 
  fallback = null 
}): React.JSX.Element | null => {
  const { featureFlags } = useContext(AppContext);

  // Update the feature flag service with current flags
  featureFlagService.setFeatureFlags(featureFlags);

  // Check if the feature is enabled
  const isEnabled = featureFlagService.isEnabled(flagName);

  if (isEnabled) {
    return <>{children}</>;
  }

  return fallback ? <>{fallback}</> : null;
};

export default Feature;