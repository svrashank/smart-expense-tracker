import { Input, InputLabel, FormControl, Button, InputAdornment, IconButton, Typography, Box } from '@mui/material';
import MailOutlineIcon from '@mui/icons-material/MailOutline';
import LockIcon from '@mui/icons-material/Lock';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios'
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import AuthLayout from '../components/AuthLayout';
import { authButtonSx, authFieldSx } from '../components/styles';
import { COLORS } from '../theme';

function SignUp() {
    const navigate = useNavigate()
    const [email,setEmail] = useState("")
    const [password,setPassword] = useState("")
    const [error, setError] = useState<string | null>(null);
    const [confirmPassword, setConfirmPassword] = useState("")
    const [success,setSuccess]  = useState<string | null>(null)
    const [showPassword,setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const [showLoginRedirect, setShowLoginRedirect] = useState(false);
    const HandleClickShowPassword  = () => setShowPassword((show) => !show);
    const HandleClickShowConfirmPassword = () => setShowConfirmPassword((show) => !show)
    function HandleEmailChange (event: React.ChangeEvent<HTMLInputElement>){
        setEmail(event.target.value)
    }
    const handleConfirmPasswordChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setConfirmPassword(event.target.value)
    }
    const HandlePasswordChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setPassword(event.target.value)
    }
    const handleMouseDownPassword = (event: React.MouseEvent<HTMLButtonElement>) => {
        event.preventDefault();
    };

    async function HandleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        if (!matchPassword()){
            setError('Passwords do not match');
            setSuccess(null);
            return;
        }
        const formData = { email, password };
        try {
            await axios.post("http://localhost:8000/auth/signup", formData);

            setSuccess("User Created")
            setError(null)
            setTimeout(() => navigate('/login'),2)
        } catch (error) {
                const detail = axios.isAxiosError(error) ? error.response?.data?.detail : undefined;
                if (detail?.code === "USER_EXISTS") {
                    setError(detail.message);
                    setShowLoginRedirect(true);
                } else {
                    setError(detail?.message || "Something went wrong");
                }
                setSuccess(null);
        }
    }
    const matchPassword = () => {
        return Boolean(password && confirmPassword && password === confirmPassword)
    }

  return (
    <AuthLayout title="Create your account" subtitle="Start keeping track of where it all goes.">
      <form onSubmit={HandleSubmit}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <FormControl fullWidth variant="standard" sx={authFieldSx}>
            <InputLabel htmlFor="email-input">Email address</InputLabel>
            <Input
              id="email-input"
              startAdornment={
                <InputAdornment position="start">
                  <MailOutlineIcon />
                </InputAdornment>
              }
              onChange={HandleEmailChange}
            />
          </FormControl>

          <FormControl fullWidth variant="standard" sx={authFieldSx}>
            <InputLabel htmlFor="password-input">Password</InputLabel>
            <Input
              id="password-input"
              type={showPassword ? "text" : "password"}
              startAdornment={
                <InputAdornment position="start">
                  <LockIcon />
                </InputAdornment>
              }
              endAdornment={
                <IconButton
                  aria-label={showPassword ? 'hide the password' : 'display the password'}
                  onClick={HandleClickShowPassword}
                  onMouseDown={handleMouseDownPassword}
                  edge="end"
                >
                  {showPassword ? <Visibility /> : <VisibilityOff />}
                </IconButton>
              }
              onChange={HandlePasswordChange}
            />
          </FormControl>

          <FormControl fullWidth variant="standard" sx={authFieldSx}>
            <InputLabel htmlFor="confirm-password-input">Confirm password</InputLabel>
            <Input
              id="confirm-password-input"
              type={showConfirmPassword ? "text" : "password"}
              startAdornment={
                <InputAdornment position="start">
                  <LockIcon sx={{ color: matchPassword() ? COLORS.accent : COLORS.negative }} />
                </InputAdornment>
              }
              endAdornment={
                <IconButton
                  aria-label={showConfirmPassword ? 'hide the password' : 'display the password'}
                  onClick={HandleClickShowConfirmPassword}
                  onMouseDown={handleMouseDownPassword}
                  edge="end"
                >
                  {showConfirmPassword ? <Visibility /> : <VisibilityOff />}
                </IconButton>
              }
              onChange={handleConfirmPasswordChange}
            />
          </FormControl>

          <Button
            fullWidth
            variant="contained"
            type="submit"
            disabled={!email || !password || !confirmPassword || !matchPassword()}
            sx={authButtonSx}
          >
            Sign up
          </Button>

          {success && (
            <Box sx={{ borderLeft: `3px solid ${COLORS.accent}`, background: COLORS.accentSoft, color: COLORS.accent, fontSize: 13.5, px: 1.5, py: 1 }}>
              {success}
            </Box>
          )}
          {error && (
            <Box sx={{ borderLeft: `3px solid ${COLORS.negative}`, background: COLORS.negativeSoft, color: COLORS.negative, fontSize: 13.5, px: 1.5, py: 1 }}>
              {showLoginRedirect ? (
                <>
                  User already exists.{" "}
                  <Box
                    component="span"
                    onClick={() => navigate('/login')}
                    sx={{ cursor: 'pointer', textDecoration: 'underline', fontWeight: 600, '&:hover': { opacity: 0.75 } }}
                  >
                    Click here to log in
                  </Box>
                </>
              ) : (
                error
              )}
            </Box>
          )}

          <Typography align="center" variant="body2" color={COLORS.muted}>
            Already have an account?{' '}
            <Box
              component="span"
              onClick={() => navigate('/login')}
              sx={{ color: COLORS.accent, fontWeight: 600, cursor: 'pointer', '&:hover': { opacity: 0.75 } }}
            >
              Log in
            </Box>
          </Typography>
        </Box>
      </form>
    </AuthLayout>
  );
}
export default SignUp
