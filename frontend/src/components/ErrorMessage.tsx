import React from 'react';
import { Message, Button } from 'semantic-ui-react';

interface ErrorMessageProps {
  error: string | null;
  onRetry?: () => void;
  onDismiss?: () => void;
  title?: string;
  showRetry?: boolean;
  showDismiss?: boolean;
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({
  error,
  onRetry,
  onDismiss,
  title = 'Error',
  showRetry = false,
  showDismiss = true,
}): React.JSX.Element | null => {
  if (!error) {
    return null;
  }

  return (
    <Message 
      negative 
      {...(showDismiss && onDismiss ? { onDismiss } : {})}
    >
      <Message.Header>{title}</Message.Header>
      <p>{error}</p>
      {(showRetry || onRetry) && (
        <div style={{ marginTop: '1em' }}>
          {onRetry && (
            <Button size="small" onClick={onRetry}>
              Try Again
            </Button>
          )}
        </div>
      )}
    </Message>
  );
};

export default ErrorMessage;