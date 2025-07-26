import { Grid, Input, InputLabel, FormControl, Button, Card, InputAdornment, IconButton, Typography, Box } from '@mui/material';
import MailOutlineIcon from '@mui/icons-material/MailOutline';
import LockIcon from '@mui/icons-material/Lock';
import GoogleIcon from '@mui/icons-material/Google';
import FacebookIcon from '@mui/icons-material/Facebook';
import GitHubIcon from '@mui/icons-material/GitHub';
import logo from "../assets/logo.png"
import { useNavigate } from 'react-router-dom';
// var logo = "../assets/logo.png"
function Login() {
    const navigate = useNavigate()
  return (
    <Card  sx={{ width: 450, margin: '2rem auto', padding: 2 }}>

    
        <Grid
        container
        direction="column"
        spacing={3}
        sx={{
            padding: 4,
            maxWidth: 400,
            margin: '0 auto',
        }}
        >
            <Grid item sx={{ textAlign: 'center' }}>
                <Box
                    component="img"
                    src={logo}
                    alt="App Logo"
                    sx={{
                    height: 80,
                    mb: 2,
                    }}
                />
            </Grid>

            <Grid item>
                <FormControl fullWidth variant="standard">
                <InputLabel htmlFor="email-input">Email address</InputLabel>
                <Input
                    id="input-with-icon-adornment"
                    startAdornment={
                        <InputAdornment position="start">
                            <MailOutlineIcon />
                        </InputAdornment>
                    }
                />
                </FormControl>
            </Grid>

            <Grid item>
                <FormControl fullWidth variant="standard">
                <InputLabel htmlFor="password-input">Password</InputLabel>
                <Input
                    id="input-with-icon-adornment"
                    startAdornment={
                        <InputAdornment position="start">
                            <LockIcon />
                        </InputAdornment>
                    }
                />
                </FormControl>
            </Grid>
            <Grid Item>
                <Button fullWidth variant="contained" color="secondary" sx={{"marginTop":"20px"}}>Login</Button>
            </Grid>
            <Grid item>
                <Typography align="center" variant="body2" sx={{ color: '#666', fontWeight: 500, mt: 2, mb: 1 }}>
                    or sign up using
                </Typography>
                </Grid>

                <Grid item>
                <Grid container spacing={2} justifyContent="center">
                    <Grid item>
                    <IconButton color="success" aria-label="Google sign up">
                        <GoogleIcon />
                    </IconButton>
                    </Grid>
                    <Grid item>
                    <IconButton color="primary" aria-label="Facebook sign up">
                        <FacebookIcon />
                    </IconButton>
                    </Grid>
                    <Grid item>
                    <IconButton color="inherit" aria-label="GitHub sign up">
                        <GitHubIcon />
                    </IconButton>
                    </Grid>
                </Grid>
            </Grid>

                <Grid item>
                    <hr></hr>
                <Typography align="center" variant="body2" sx={{ color: '#666', fontWeight: 500, mt: 2, mb: 1 }}>
                    or sign up with email
                </Typography>
                <Button 
                    fullWidth 
                    variant="outlined" 
                    color="primary" 
                    sx={{ mt: 1 }}
                    onClick={()=>{navigate('/signup')}}
                >
                    Sign Up
                </Button>
            </Grid>
        </Grid>
    </Card>
  );
}

export default Login;
