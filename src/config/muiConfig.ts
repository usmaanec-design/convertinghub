import { createTheme, ThemeOptions } from '@mui/material';

const sharedThemeOptions: ThemeOptions = {
  breakpoints: {
    values: {
      xs: 0,
      sm: 600,
      md: 900,
      lg: 1200,
      xl: 1536
    }
  },
  typography: {
    fontFamily: [
      'Inter',
      'Roboto',
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Cairo',
      'Noto Naskh Arabic',
      'Tahoma',
      'Arial',
      'sans-serif'
    ].join(','),
    button: {
      textTransform: 'none',
      fontWeight: 'bold'
    }
  },
  zIndex: { snackbar: 100000 }
};

export const lightTheme = createTheme({
  ...sharedThemeOptions,
  palette: {
    mode: 'light',
    primary: {
      main: '#f97316', // Orange Primary Brand Color
      light: '#fb923c',
      dark: '#ea580c',
      contrastText: '#ffffff'
    },
    secondary: {
      main: '#3b82f6',
      light: '#60a5fa',
      dark: '#2563eb'
    },
    background: {
      default: '#F8FAF9',
      paper: '#FFFFFF',
      hover: '#FFF7ED',
      lightSecondary: '#FFEDD5',
      darkSecondary: '#ea580c'
    }
  },
  components: {
    MuiButton: {
      styleOverrides: {
        containedPrimary: {
          color: '#ffffff',
          backgroundColor: '#f97316',
          '&:hover': {
            backgroundColor: '#ea580c'
          }
        }
      }
    },
    MuiChip: {
      styleOverrides: {
        colorPrimary: {
          backgroundColor: '#ffedd5',
          color: '#c2410c',
          fontWeight: 'bold'
        }
      }
    },
    MuiInputBase: {
      styleOverrides: {
        root: {
          '@media (max-width: 600px)': {
            fontSize: '14px !important',
            minHeight: '38px !important'
          }
        },
        input: {
          '@media (max-width: 600px)': {
            padding: '7px 10px !important',
            fontSize: '14px !important'
          }
        }
      }
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          '@media (max-width: 600px)': {
            borderRadius: '8px'
          }
        },
        input: {
          '@media (max-width: 600px)': {
            padding: '7px 10px !important'
          }
        }
      }
    },
    MuiSelect: {
      styleOverrides: {
        select: {
          '@media (max-width: 600px)': {
            padding: '7px 10px !important',
            fontSize: '14px !important',
            minHeight: '20px !important'
          }
        }
      }
    },
    MuiInputLabel: {
      styleOverrides: {
        root: {
          '@media (max-width: 600px)': {
            fontSize: '13px !important'
          }
        }
      }
    },
    MuiFormLabel: {
      styleOverrides: {
        root: {
          '@media (max-width: 600px)': {
            fontSize: '13px !important'
          }
        }
      }
    }
  }
});

export const darkTheme = createTheme({
  ...sharedThemeOptions,
  palette: {
    mode: 'dark',
    primary: {
      main: '#f97316', // Orange Primary Brand Color
      light: '#fb923c',
      dark: '#ea580c',
      contrastText: '#ffffff'
    },
    secondary: {
      main: '#60a5fa'
    },
    background: {
      default: '#121212',
      paper: '#1E1E1E',
      hover: '#2A231D',
      lightSecondary: '#332314',
      darkSecondary: '#ea580c'
    },
    text: { primary: '#ffffff' }
  },
  components: {
    MuiButton: {
      styleOverrides: {
        containedPrimary: {
          color: '#ffffff',
          backgroundColor: '#f97316',
          '&:hover': {
            backgroundColor: '#ea580c'
          }
        }
      }
    },
    MuiInputBase: {
      styleOverrides: {
        root: {
          '@media (max-width: 600px)': {
            fontSize: '14px !important',
            minHeight: '38px !important'
          }
        },
        input: {
          '@media (max-width: 600px)': {
            padding: '7px 10px !important',
            fontSize: '14px !important'
          }
        }
      }
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          '@media (max-width: 600px)': {
            borderRadius: '8px'
          }
        },
        input: {
          '@media (max-width: 600px)': {
            padding: '7px 10px !important'
          }
        }
      }
    },
    MuiSelect: {
      styleOverrides: {
        select: {
          '@media (max-width: 600px)': {
            padding: '7px 10px !important',
            fontSize: '14px !important',
            minHeight: '20px !important'
          }
        }
      }
    },
    MuiInputLabel: {
      styleOverrides: {
        root: {
          '@media (max-width: 600px)': {
            fontSize: '13px !important'
          }
        }
      }
    },
    MuiFormLabel: {
      styleOverrides: {
        root: {
          '@media (max-width: 600px)': {
            fontSize: '13px !important'
          }
        }
      }
    }
  }
});
