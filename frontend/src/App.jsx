import { useEffect, useState } from "react"
import { BrowserRouter, Route, Routes } from "react-router-dom"
import { ToastContainer } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"
import ForbiddenPage from "./components/ForbiddenPage"
import Login from "./components/Login"

import Logout from "./components/Logout"
import Profile from "./components/Profile"
import ProtectedRoute from "./context/ProtectedRoute"
import AdminLayout from "./layouts/AdminLayout"
import LeaderLayout from "./layouts/LeaderLayout"
import PostLayout from "./layouts/PostLayout"
import UserLayout from "./layouts/UserLayout"

import {
  AdminAttandance, AdminEntryExit, AdminPost, AdminRegulation, AdminUsers, Departament
} from "./pages/admin/index"

import {
  LeaderAttendance, LeaderUsers
} from "./pages/leader/index"

import PostMonitor from "./pages/post/PostManitor"
import PostUsers from "./pages/post/PostUsers"
import {
  UserAttandance, UserDepartment, UserUsers
} from "./pages/user/index"

const App = () => {
  const [authorized, setAuthorized] = useState(null)

  useEffect(() => {
    const appKey = localStorage.getItem("app_key")
    const envKey = import.meta.env.VITE_APP_SECRET_KEY
    if (appKey && envKey && appKey === envKey) {
      setAuthorized(true)
    } else {
      setAuthorized(false)
    }
  }, [])

  if (authorized === null) return <div>Tekshirilmoqda...</div>
  if (!authorized) return <ForbiddenPage />


  return (
    <BrowserRouter>
      <ToastContainer position="top-right" autoClose={3000} />

      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/logout" element={<Logout />} />

        {/* ADMIN */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Departament />} />
          <Route path="departament" element={<Departament />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="attandance" element={<AdminAttandance />} />
          <Route path="post" element={<AdminPost />} />
          <Route path="entry-exit" element={<AdminEntryExit />} />
          <Route path="regulation" element={<AdminRegulation />} />
          <Route path="profile" element={<Profile />} />
        </Route>

        {/* VIEWER */}
        <Route
          path="/viewer"
          element={
            <ProtectedRoute allowedRoles={["viewer"]}>
              <UserLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<UserAttandance />} />
          <Route path="departament" element={<UserDepartment />} />
          <Route path="users" element={<UserUsers />} />
          <Route path="attandance" element={<UserAttandance />} />
          <Route path="profile" element={<Profile />} />
        </Route>

        {/* LEADER */}
        <Route
          path="/leader"
          element={
            <ProtectedRoute allowedRoles={["leader"]}>
              <LeaderLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<LeaderUsers />} />
          <Route path="departament" element={<UserDepartment />} />
          <Route path="attandance" element={<LeaderAttendance />} />
          <Route path="entry-exit" element={<UserAttandance />} />
          <Route path="profile" element={<Profile />} />
        </Route>

        {/* POST */}
        <Route
          path="/post"
          element={
            <ProtectedRoute allowedRoles={["post"]}>
              <PostLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<PostUsers />} />
          <Route path="departament" element={<UserDepartment />} />
          <Route path="users" element={<UserUsers />} />
          <Route path="attandance" element={<PostUsers />} />
          <Route path="profile" element={<Profile />} />
        </Route>

        <Route path="manitor" element={<PostMonitor />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
