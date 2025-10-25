import React from 'react';
import { useFeatureFlag } from '../hooks/useFeatureFlag';

interface VariantRendererProps {
  flagName: string;
  variants: Record<string, React.ReactNode>;
  defaultComponent?: React.ReactNode;
  context?: Record<string, unknown>;
}

const VariantRenderer: React.FC<VariantRendererProps> = ({
  flagName,
  variants,
  defaultComponent = null,
  context,
}): React.JSX.Element | null => {
  const { isEnabled, variant } = useFeatureFlag(flagName, context);

  if (!isEnabled) {
    return defaultComponent ? <>{defaultComponent}</> : null;
  }

  // If variant is a string and matches one of our variant keys
  if (typeof variant === 'string' && variants[variant]) {
    return <>{variants[variant]}</>;
  }

  // If variant is a boolean and true, try to render 'default' variant
  if (variant === true && variants['default']) {
    return <>{variants['default']}</>;
  }

  // If variant is an object with a 'type' property
  if (typeof variant === 'object' && variant !== null && 'type' in variant) {
    const variantType = (variant as { type: string }).type;
    if (variants[variantType]) {
      return <>{variants[variantType]}</>;
    }
  }

  // Fallback to default component
  return defaultComponent ? <>{defaultComponent}</> : null;
};

export default VariantRenderer;