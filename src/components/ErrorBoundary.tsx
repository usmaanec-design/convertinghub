import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Box, Typography, Button, Container } from '@mui/material';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(
      '[ConvertingHub ErrorBoundary] Uncaught error:',
      error,
      errorInfo
    );
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <Container maxWidth="sm" sx={{ py: 8, textAlign: 'center' }}>
          <Box
            sx={{
              p: 4,
              borderRadius: 3,
              bgcolor: 'background.paper',
              boxShadow: 3,
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}
          >
            <Typography
              variant="h4"
              component="h1"
              gutterBottom
              fontWeight="bold"
            >
              Something went wrong
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
              An unexpected error occurred while rendering this tool. Please try
              reloading or return to the homepage.
            </Typography>
            <Button
              variant="contained"
              color="primary"
              size="large"
              onClick={this.handleReset}
              sx={{ px: 4, py: 1.5, borderRadius: 2 }}
            >
              Return to Homepage
            </Button>
          </Box>
        </Container>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
