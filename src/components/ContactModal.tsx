import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  TextField,
  Stack,
  IconButton,
  Alert,
  Paper,
  CircularProgress
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import EmailIcon from '@mui/icons-material/Email';
import PhoneIcon from '@mui/icons-material/Phone';
import PersonIcon from '@mui/icons-material/Person';
import SendIcon from '@mui/icons-material/Send';

interface ContactModalProps {
  open: boolean;
  onClose: () => void;
}

export const ContactModal: React.FC<ContactModalProps> = ({
  open,
  onClose
}) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !message) return;

    setLoading(true);

    try {
      const response = await fetch(
        'https://formsubmit.co/ajax/it.expert.usmaan@gmail.com',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json'
          },
          body: JSON.stringify({
            _subject: `ConvertingHub Contact Form Message from ${
              name || 'Visitor'
            }`,
            Name: name || 'Anonymous Visitor',
            Email: email,
            Message: message
          })
        }
      );

      if (response.ok) {
        setSubmitted(true);
        setTimeout(() => {
          setName('');
          setEmail('');
          setMessage('');
          setSubmitted(false);
          onClose();
        }, 3000);
      } else {
        // Fallback to mailto link if endpoint fails
        window.open(
          `mailto:it.expert.usmaan@gmail.com?subject=ConvertingHub%20Contact%20Form&body=Name:%20${encodeURIComponent(
            name
          )}%0D%0AEmail:%20${encodeURIComponent(
            email
          )}%0D%0AMessage:%20${encodeURIComponent(message)}`
        );
        setSubmitted(true);
      }
    } catch (err) {
      // Direct mailto fallback on network error
      window.open(
        `mailto:it.expert.usmaan@gmail.com?subject=ConvertingHub%20Contact%20Form&body=Name:%20${encodeURIComponent(
          name
        )}%0D%0AEmail:%20${encodeURIComponent(
          email
        )}%0D%0AMessage:%20${encodeURIComponent(message)}`
      );
      setSubmitted(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 4,
          p: 1
        }
      }}
    >
      <DialogTitle
        sx={{
          m: 0,
          p: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <Typography variant="h6" fontWeight={800} color="primary.main">
          Contact ConvertingHub
        </Typography>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers sx={{ p: 3 }}>
        <Stack spacing={3}>
          {/* Owner & Contact Details */}
          <Paper
            variant="outlined"
            sx={{
              p: 2.5,
              borderRadius: 3,
              bgcolor: 'background.default',
              borderColor: 'divider'
            }}
          >
            <Typography
              variant="subtitle2"
              fontWeight={800}
              color="text.primary"
              gutterBottom
            >
              Owner &amp; Support Details
            </Typography>
            <Stack spacing={1.5} mt={1.5}>
              <Box display="flex" alignItems="center" gap={1.5}>
                <PersonIcon fontSize="small" color="primary" />
                <Typography variant="body2" color="text.primary">
                  <strong>Name:</strong> Muhammad Usman
                </Typography>
              </Box>
              <Box display="flex" alignItems="center" gap={1.5}>
                <EmailIcon fontSize="small" color="primary" />
                <Typography variant="body2" color="text.primary">
                  <strong>Email:</strong> it.expert.usmaan@gmail.com
                </Typography>
              </Box>
              <Box display="flex" alignItems="center" gap={1.5}>
                <PhoneIcon fontSize="small" color="primary" />
                <Typography variant="body2" color="text.primary">
                  <strong>Phone:</strong> +966503763410
                </Typography>
              </Box>
            </Stack>
          </Paper>

          {submitted ? (
            <Alert
              severity="success"
              sx={{ borderRadius: 3, fontWeight: 'bold' }}
            >
              Thank you! Your message has been sent successfully to
              it.expert.usmaan@gmail.com.
            </Alert>
          ) : (
            <form onSubmit={handleSubmit}>
              <Stack spacing={2}>
                <Typography variant="subtitle2" fontWeight={700}>
                  Send us a direct message
                </Typography>
                <TextField
                  label="Your Name"
                  variant="outlined"
                  size="small"
                  fullWidth
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
                <TextField
                  label="Your Email *"
                  type="email"
                  variant="outlined"
                  size="small"
                  required
                  fullWidth
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <TextField
                  label="Message *"
                  variant="outlined"
                  size="small"
                  multiline
                  rows={4}
                  required
                  fullWidth
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                />
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  size="large"
                  disabled={loading}
                  startIcon={
                    loading ? (
                      <CircularProgress size={20} color="inherit" />
                    ) : (
                      <SendIcon />
                    )
                  }
                  sx={{
                    borderRadius: 3,
                    textTransform: 'none',
                    fontWeight: 700,
                    mt: 1
                  }}
                >
                  {loading ? 'Sending Message...' : 'Send Message'}
                </Button>
              </Stack>
            </form>
          )}
        </Stack>
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button
          onClick={onClose}
          variant="outlined"
          sx={{ borderRadius: 2, textTransform: 'none' }}
        >
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ContactModal;
