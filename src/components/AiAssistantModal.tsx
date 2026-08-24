import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Box,
  Stack,
  Chip,
  Alert,
  CircularProgress,
  IconButton,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Tooltip
} from '@mui/material';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import CloseIcon from '@mui/icons-material/Close';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CheckIcon from '@mui/icons-material/Check';
import TranslateIcon from '@mui/icons-material/Translate';
import SpellcheckIcon from '@mui/icons-material/Spellcheck';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import SummarizeIcon from '@mui/icons-material/Summarize';
import { processAiTask } from '../utils/aiService';

export interface AiAssistantModalProps {
  open: boolean;
  onClose: () => void;
  initialText?: string;
  onApplyResult?: (resultText: string) => void;
}

type AiTaskType = 'summarize' | 'rephrase' | 'fix_grammar' | 'translate';

export default function AiAssistantModal({
  open,
  onClose,
  initialText = '',
  onApplyResult
}: AiAssistantModalProps) {
  const [inputText, setInputText] = useState<string>(initialText);
  const [task, setTask] = useState<AiTaskType>('summarize');
  const [targetLang, setTargetLang] = useState<string>('Spanish');
  const [outputResult, setOutputResult] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  const handleProcess = async () => {
    if (!inputText.trim()) {
      setError('Please enter or paste text to process with AI.');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      setCopied(false);
      const result = await processAiTask(inputText, task, targetLang);
      setOutputResult(result);
    } catch (err: any) {
      setError(err.message || 'AI request failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    if (outputResult) {
      navigator.clipboard.writeText(outputResult);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          boxShadow: 24,
          background: 'linear-gradient(135deg, #1e1e2d 0%, #0d0d15 100%)',
          color: '#fff',
          border: '1px solid rgba(255,255,255,0.1)'
        }
      }}
    >
      <DialogTitle
        sx={{
          m: 0,
          p: 2.5,
          display: 'flex',
          alignItems: 'center',
          justify: 'space-between',
          borderBottom: '1px solid rgba(255,255,255,0.08)'
        }}
      >
        <Box display="flex" alignItems="center" gap={1.5}>
          <Box
            sx={{
              p: 1,
              borderRadius: 2,
              background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
              display: 'flex'
            }}
          >
            <AutoAwesomeIcon sx={{ color: '#fff', fontSize: 24 }} />
          </Box>
          <Box>
            <Typography variant="h6" fontWeight="bold" sx={{ color: '#fff' }}>
              Genkit AI Assistant
            </Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)' }}>
              Powered by Google Gemini 3.6 Flash
            </Typography>
          </Box>
        </Box>
        <IconButton onClick={onClose} sx={{ color: 'rgba(255,255,255,0.7)' }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 3 }}>
        <Stack spacing={3} mt={1}>
          {error && (
            <Alert
              severity="error"
              onClose={() => setError(null)}
              sx={{ bgcolor: 'rgba(211, 47, 47, 0.2)', color: '#ff8a80' }}
            >
              {error}
            </Alert>
          )}

          {/* Task Selectors */}
          <Box>
            <Typography variant="subtitle2" sx={{ color: 'rgba(255,255,255,0.7)', mb: 1 }}>
              Select AI Action:
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap gap={1}>
              <Chip
                icon={<SummarizeIcon sx={{ color: task === 'summarize' ? '#fff !important' : 'inherit' }} />}
                label="Summarize"
                onClick={() => setTask('summarize')}
                sx={{
                  bgcolor: task === 'summarize' ? '#6366f1' : 'rgba(255,255,255,0.05)',
                  color: '#fff',
                  '&:hover': { bgcolor: task === 'summarize' ? '#4f46e5' : 'rgba(255,255,255,0.1)' }
                }}
              />
              <Chip
                icon={<AutoFixHighIcon sx={{ color: task === 'rephrase' ? '#fff !important' : 'inherit' }} />}
                label="Rephrase / Rewrite"
                onClick={() => setTask('rephrase')}
                sx={{
                  bgcolor: task === 'rephrase' ? '#6366f1' : 'rgba(255,255,255,0.05)',
                  color: '#fff',
                  '&:hover': { bgcolor: task === 'rephrase' ? '#4f46e5' : 'rgba(255,255,255,0.1)' }
                }}
              />
              <Chip
                icon={<SpellcheckIcon sx={{ color: task === 'fix_grammar' ? '#fff !important' : 'inherit' }} />}
                label="Fix Grammar"
                onClick={() => setTask('fix_grammar')}
                sx={{
                  bgcolor: task === 'fix_grammar' ? '#6366f1' : 'rgba(255,255,255,0.05)',
                  color: '#fff',
                  '&:hover': { bgcolor: task === 'fix_grammar' ? '#4f46e5' : 'rgba(255,255,255,0.1)' }
                }}
              />
              <Chip
                icon={<TranslateIcon sx={{ color: task === 'translate' ? '#fff !important' : 'inherit' }} />}
                label="Translate"
                onClick={() => setTask('translate')}
                sx={{
                  bgcolor: task === 'translate' ? '#6366f1' : 'rgba(255,255,255,0.05)',
                  color: '#fff',
                  '&:hover': { bgcolor: task === 'translate' ? '#4f46e5' : 'rgba(255,255,255,0.1)' }
                }}
              />
            </Stack>
          </Box>

          {task === 'translate' && (
            <FormControl size="small" sx={{ maxWidth: 200 }}>
              <InputLabel sx={{ color: 'rgba(255,255,255,0.7)' }}>Target Language</InputLabel>
              <Select
                value={targetLang}
                label="Target Language"
                onChange={(e) => setTargetLang(e.target.value)}
                sx={{
                  color: '#fff',
                  '.MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.2)' },
                  '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#6366f1' },
                  '.MuiSvgIcon-root': { color: '#fff' }
                }}
              >
                <MenuItem value="Spanish">Spanish</MenuItem>
                <MenuItem value="French">French</MenuItem>
                <MenuItem value="German">German</MenuItem>
                <MenuItem value="Urdu">Urdu</MenuItem>
                <MenuItem value="Arabic">Arabic</MenuItem>
                <MenuItem value="Chinese">Chinese</MenuItem>
                <MenuItem value="Japanese">Japanese</MenuItem>
              </Select>
            </FormControl>
          )}

          {/* Input Area */}
          <TextField
            multiline
            rows={4}
            fullWidth
            placeholder="Paste or enter your document text here..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            variant="outlined"
            sx={{
              '& .MuiInputBase-root': {
                color: '#fff',
                bgcolor: 'rgba(255,255,255,0.03)',
                borderRadius: 2,
                '& fieldset': { borderColor: 'rgba(255,255,255,0.1)' },
                '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.3)' },
                '&.Mui-focused fieldset': { borderColor: '#6366f1' }
              }
            }}
          />

          {/* Action Trigger Button */}
          <Button
            variant="contained"
            size="large"
            onClick={handleProcess}
            disabled={isLoading}
            startIcon={
              isLoading ? (
                <CircularProgress size={20} color="inherit" />
              ) : (
                <AutoAwesomeIcon />
              )
            }
            sx={{
              py: 1.2,
              background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
              color: '#fff',
              fontWeight: 'bold',
              borderRadius: 2,
              '&:hover': {
                background: 'linear-gradient(135deg, #4f46e5 0%, #9333ea 100%)'
              }
            }}
          >
            {isLoading ? 'Processing with AI...' : `Run AI ${task.toUpperCase()}`}
          </Button>

          {/* Output Card */}
          {outputResult && (
            <Box
              sx={{
                p: 2.5,
                borderRadius: 2,
                bgcolor: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                position: 'relative'
              }}
            >
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                <Typography variant="subtitle2" sx={{ color: '#a855f7', fontWeight: 'bold' }}>
                  AI Response:
                </Typography>
                <Tooltip title={copied ? 'Copied!' : 'Copy to clipboard'}>
                  <IconButton onClick={handleCopy} size="small" sx={{ color: '#fff' }}>
                    {copied ? <CheckIcon color="success" /> : <ContentCopyIcon fontSize="small" />}
                  </IconButton>
                </Tooltip>
              </Box>
              <Typography
                variant="body2"
                sx={{
                  color: 'rgba(255,255,255,0.9)',
                  whiteSpace: 'pre-wrap',
                  lineHeight: 1.6
                }}
              >
                {outputResult}
              </Typography>
            </Box>
          )}
        </Stack>
      </DialogContent>

      <DialogActions sx={{ p: 2.5, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        {onApplyResult && outputResult && (
          <Button
            variant="outlined"
            onClick={() => {
              onApplyResult(outputResult);
              onClose();
            }}
            sx={{
              borderColor: '#6366f1',
              color: '#fff',
              '&:hover': { borderColor: '#a855f7', bgcolor: 'rgba(99,102,241,0.1)' }
            }}
          >
            Apply to Document
          </Button>
        )}
        <Button onClick={onClose} sx={{ color: 'rgba(255,255,255,0.7)' }}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}
