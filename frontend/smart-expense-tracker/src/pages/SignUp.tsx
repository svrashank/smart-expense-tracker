import { Grid, Input, InputLabel, Checkbox, Alert, FormControl, Button, Card, InputAdornment, IconButton, Typography, Box, FormControlLabel } from '@mui/material';
import MailOutlineIcon from '@mui/icons-material/MailOutline';
import LockIcon from '@mui/icons-material/Lock';
import { useState } from 'react';
import logo from "../assets/logo.png"
import { useNavigate } from 'react-router-dom';
import axios from 'axios'
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { FlashOnRounded } from '@mui/icons-material';
// var logo = "../assets/logo.png"
function SignUp() {
    const navigate = useNavigate()
    const [email,setEmail] = useState("")
    const [password,setPassword] = useState("")
    const [error, setError] = useState(null);
    const [confirmPassword, setConfirmPassword] = useState("")
    const [success,setSuccess]  = useState(null)
    const [showPassword,setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const HandleClickShowPassword  = () => setShowPassword((show) => !show);
    const HandleClickShowConfirmPassword = () => setShowConfirmPassword((show) => !show)
    function HandleEmailChange (event){
        setEmail(event.target.value)
    }
    const handleConfirmPasswordChange = (event) => {
        setConfirmPassword(event.target.value)
    }
    const HandlePasswordChange = (event) => {
        setPassword(event.target.value)
    }
      const handleMouseDownPassword = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    };

    const handleMouseUpPassword = (event: React.MouseEvent<HTMLButtonElement>) => {
        event.preventDefault();
    };
    async function HandleSubmit(e) {
        e.preventDefault();
        if (!matchPassword()){
            setError('Passwords do not match');
            setSuccess(null);
            return;
        }
        const formData = { email, password };
        try {
            const response = await axios.post("http://localhost:8000/auth/signup", formData);

            setSuccess("User Created")
            setError(null)
            setTimeout(() => navigate('/'),2)
            // Optionally: navigate("/login") or show success
        } catch (error) {
            const error_message = error.response?.data?.detail || "Something went wrong, please try again"
            setError(error_message);
            setSuccess(null)
        }
    }
    const HandleCheck = () => {
        console.log("Change")
    }
    const matchPassword = () => {
        if((password && confirmPassword) && (password === confirmPassword)){
            return true
        }
        else {
            return false
        }
        
    }
  return (

    <Card  sx={{ width: 450, height:570, margin: '2rem auto', padding: 2, borderRadius: 12 }}>

    
        <Grid
        container
        direction="column"
        spacing={3}
        sx={{
            padding: 4,
            maxWidth: 400,
            margin: '0 auto',
            justifyContent: "center",
            alignItems: "stretch",
            height : "100%"
        }}
        >
            <Grid item sx={{ textAlign: 'Center' }}>
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
            <form onSubmit={HandleSubmit} style = {{width : "100%"}} >
                <Grid container direction={'column'} spacing = {3}>
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
                        onChange={HandleEmailChange}
                    />
                    </FormControl>
                </Grid>

                <Grid item>
                    <FormControl fullWidth variant="standard">
                    <InputLabel htmlFor="password-input">Password</InputLabel>
                    <Input
                        id="input-with-icon-adornment"
                        type = {showPassword? "text":"password"}
                        startAdornment={
                            <InputAdornment position="start">
                                <LockIcon />

                            </InputAdornment>
                        }
                        endAdornment = {

                                <IconButton 
                                    aria-label={
                                        showPassword ? 'hide the password' : 'display the password'
                                    }
                                    onClick={HandleClickShowPassword}
                                    edge = 'end'
                                    >
                                        {showPassword ? <Visibility /> : <VisibilityOff />}
                                    </IconButton>
                        }
                        onChange={HandlePasswordChange}
                    />
                    </FormControl>
                </Grid>
                <Grid item>
                    <FormControl fullWidth variant="standard">
                    <InputLabel htmlFor="outlined-adornment-password">Confirm Password</InputLabel>
                    <Input
                        id="input-with-icon-adornment"
                        type = {showConfirmPassword? "text":"password"}
                        startAdornment={
                            <InputAdornment position="start">
                                <LockIcon
                                    sx={{color : matchPassword()?  '#638b06ff' : '#c93056ff'}} 
                                />
                            </InputAdornment>
                        }
                        endAdornment = {
                            <IconButton 
                                aria-label={
                                    showConfirmPassword ? 'hide the password' : 'display the password'
                                }
                                onClick = {HandleClickShowConfirmPassword}
                                edge = "end"
                                >
                                {showConfirmPassword? <Visibility /> : <VisibilityOff />}

                            </IconButton>
                        }
                        onChange={handleConfirmPasswordChange}
                    />
                    </FormControl>
                </Grid>
                <Grid item>
                    <Grid container spacing={2} justifyContent="center">
                    </Grid>
                </Grid>

                <Grid item>
                    <Button 
                        fullWidth 
                        variant="contained" 
                        color="secondary" 
                        sx={{ mt: 1 ,borderRadius: 12, height:"50px",fontSize:"16px" }}
                        type='submit'
                        disabled = { !email || !password || !confirmPassword || !matchPassword()}
                        // onClick={matchPassword()? HandleSubmit:console.log("mismatch")}
                    >
                        Sign Up
                    </Button>
                    {success && (
                        <Grid item>
                            <Alert severity="success" sx={{ my: 2 }}>
                            {success}
                            </Alert>
                        </Grid>
                        )}
                    {error && (
                        <Grid item>
                            <Alert severity="error" sx={{ my: 2 }}>
                            {error}
                            </Alert>
                        </Grid>
                        )}

                </Grid>
            </Grid>
            </form>
        </Grid>
    </Card>
  );
}
export default SignUp