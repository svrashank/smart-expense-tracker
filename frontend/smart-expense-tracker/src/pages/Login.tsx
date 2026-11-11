import { Input, InputLabel, FormControl, Button, Typography, Box, InputAdornment, Fade } from '@mui/material';
import MailOutlineIcon from '@mui/icons-material/MailOutline';
import LockIcon from '@mui/icons-material/Lock';
import { useNavigate } from 'react-router-dom';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import { useEffect, useState } from 'react';
import axios from 'axios';
import AuthLayout from '../components/AuthLayout';
import { authButtonSx, authFieldSx } from '../components/styles';
import { COLORS } from '../theme';

function AnimatedPassword({ success, onChange, disabled }: { success?: boolean; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; disabled?: boolean }) {
    const [progress, setProgress] = useState(0)
    useEffect(()=>{
        if (success){
            setProgress(0);
            const interval = setInterval(() => {
                setProgress((prev) => {
                    if (prev >= 100) {
                        clearInterval(interval);
                        return 100;
                    }
                    return prev + 2

                })
            },40)
            return () => clearInterval(interval);
        }
        else {
            setProgress(0)
        }
    }, [success])
    return (
        <Box sx={{ position: 'relative', width: '100%' }}>
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          height: '100%',
          width: `${progress}%`,
          bgcolor: COLORS.accent,
          opacity: 0.15,
          transition: 'width 40ms linear',
          pointerEvents: 'none',
          zIndex: 1,
        }}
      />
      <FormControl fullWidth variant="standard" sx={{ position: 'relative', zIndex: 2, ...authFieldSx }}>
        <InputLabel
          sx={{
            color: success ? COLORS.accent : undefined,
            transition: 'color 0.5s ease',
          }}
        >
          Password
        </InputLabel>
        <Input
          type="password"
          disabled={disabled}
          onChange={onChange}
          startAdornment={
            <InputAdornment position="start" sx={{ position: 'relative', zIndex: 3 }}>
              <Fade in={!success} timeout={300} unmountOnExit>
                <LockIcon />
              </Fade>
              <Fade in={success} timeout={600}>
                <LockOpenIcon sx={{ color: COLORS.accent }} />
              </Fade>
            </InputAdornment>
          }
          sx={{
            color: success ? 'transparent' : undefined,
            transition: 'color 1s ease',
            position: 'relative',
            zIndex: 3,
          }}
        />
      </FormControl>
    </Box>
    )
}

function Login() {
    const navigate = useNavigate()
    const [password,setPassword] = useState('')
    const [email,setEmail] = useState('')
    const [success, setSuccess] = useState<boolean | undefined>(undefined)
    const [loading,setLoading] = useState(false)
    const [error,setError] = useState('')
    const [shake, setShake] = useState(false);
    function handleEmailChange(event: React.ChangeEvent<HTMLInputElement>) {
        setEmail(event.target.value)
    }
    function handlePasswordChange(event: React.ChangeEvent<HTMLInputElement>){
        setPassword(event.target.value)
    }
    function handleSubmit (event : React.FormEvent<HTMLFormElement>) {

        const data = new URLSearchParams()
        data.append("username",email)
        data.append("password",password)
        event.preventDefault();
        axios.post("http://localhost:8000/auth/login",
                    data,
                    {
                        headers :{
                                'Content-Type': "application/x-www-form-urlencoded",
                        },
                        withCredentials: true
                    }
            )
             .then(() => {
                setSuccess(true);
                setTimeout(() => {
                    setLoading(true);
                    setTimeout(() =>{
                        navigate("/home")
                    },2000)

                },600)})
             .catch((error) =>  {
                setSuccess(false)
                setLoading(false)
                if (error.response && error.response.data){
                    setError(error.response.data.detail || "Login Error")
                    setShake(true);
                    setTimeout(() => setShake(false), 500);
                }
                else {
                    setError("Network Error, Please try again later")
                    setShake(true);
                    setTimeout(() => setShake(false), 500);
                }
                console.log(error)})

    }
  return (
    <AuthLayout title="Welcome back" subtitle="Log in to see where things stand.">
      <Box sx={{ animation: shake ? "shake 0.3s" : "none" }}>
        {error && (
          <Box
            sx={{
              borderLeft: `3px solid ${COLORS.negative}`,
              background: COLORS.negativeSoft,
              color: COLORS.negative,
              fontSize: 13.5,
              px: 1.5,
              py: 1,
              mb: 2.5,
            }}
          >
            {error}
          </Box>
        )}

        <form onSubmit={handleSubmit}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Fade in={!success} timeout={500}>
              <FormControl fullWidth variant="standard" sx={authFieldSx}>
                <InputLabel htmlFor="email-input">Email address</InputLabel>
                <Input
                  id="email-input"
                  onChange={handleEmailChange}
                  startAdornment={
                    <InputAdornment position="start">
                      <MailOutlineIcon />
                    </InputAdornment>
                  }
                />
              </FormControl>
            </Fade>

            <AnimatedPassword success={success} onChange={handlePasswordChange} disabled={loading} />

            <Fade in={!success} timeout={500}>
              <Button type="submit" fullWidth variant="contained" sx={authButtonSx}>
                Log in
              </Button>
            </Fade>

            <Fade in={!success}>
              <Typography align="center" variant="body2" color={COLORS.muted}>
                Don't have an account?{' '}
                <Box
                  component="span"
                  onClick={() => navigate('/signup')}
                  sx={{ color: COLORS.accent, fontWeight: 600, cursor: 'pointer', '&:hover': { opacity: 0.75 } }}
                >
                  Sign up
                </Box>
              </Typography>
            </Fade>
          </Box>
        </form>
      </Box>
    </AuthLayout>
  );
}

export default Login;
