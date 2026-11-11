import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import './App.css'
import Login from './pages/Login'
import SignUp from './pages/SignUp'
import Home from './pages/Home'
import Transactions from './pages/Transactions'
import Budgets from './pages/Budgets'
import Goals from './pages/Goals'
import Investments from './pages/Investments'
import Accounts from './pages/Accounts'
import Settings from './pages/Settings'
import NotFound from './pages/NotFound'
import DashboardLayout from './components/DashboardLayout'

function App() {

  return (
    <BrowserRouter>
      <Routes>
        <Route path='/' element={<Navigate to='/home' replace />} />
        <Route path='/login' element={<Login />} />
        <Route path='/signup' element={<SignUp />} />
        <Route element={<DashboardLayout />}>
          <Route path='/home' element={<Home />} />
          <Route path='/transactions' element={<Transactions />} />
          <Route path='/budgets' element={<Budgets />} />
          <Route path='/goals' element={<Goals />} />
          <Route path='/investments' element={<Investments />} />
          <Route path='/accounts' element={<Accounts />} />
          <Route path='/settings' element={<Settings />} />
          <Route path='/profile' element={<Navigate to='/settings' replace />} />
        </Route>
        <Route path='*' element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
