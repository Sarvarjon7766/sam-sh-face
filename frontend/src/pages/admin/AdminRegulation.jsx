import axios from "axios"
import { useEffect, useRef, useState } from "react"
import { FiRefreshCw, FiSave, FiSearch } from "react-icons/fi"
import { PulseLoader } from "react-spinners"
import { ToastContainer, toast } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"

const AdminRegulation = () => {
	const token = localStorage.getItem("token")
	const [users, setUsers] = useState([])
	const [filteredUsers, setFilteredUsers] = useState([])
	const [searchTerm, setSearchTerm] = useState("")
	const [refreshing, setRefreshing] = useState(false)
	const [saving, setSaving] = useState(false)
	const [isChanged, setIsChanged] = useState(false)
	const dragItem = useRef(null)
	const dragOverItem = useRef(null)

	// 👥 Foydalanuvchilarni olish
	const fetchUsers = async () => {
		try {
			setRefreshing(true)
			const res = await axios.get(`${import.meta.env.VITE_BASE_URL}/api/user/getAll`, {
				headers: { Authorization: `Bearer ${token}` },
			})
			if (res.data.success) {
				const sorted = [...res.data.users].sort((a, b) => a.lavel - b.lavel)
				setUsers(sorted)
				setFilteredUsers(sorted)
				setIsChanged(false)
			}
		} catch (error) {
			toast.error("Foydalanuvchilarni yuklashda xatolik ❌")
		} finally {
			setRefreshing(false)
		}
	}

	useEffect(() => {
		fetchUsers()
	}, [])

	// 🔍 Qidiruv
	useEffect(() => {
		let result = [...users]
		if (searchTerm.trim()) {
			const term = searchTerm.toLowerCase()
			result = result.filter(
				(user) =>
					user.fullName.toLowerCase().includes(term) ||
					user.position.toLowerCase().includes(term) ||
					user.username.toLowerCase().includes(term)
			)
		}
		setFilteredUsers(result)
	}, [searchTerm, users])

	// 🧭 Holat ranglari
	const getStatusClass = (status) => {
		switch (status) {
			case "kelmagan":
				return "bg-red-100 text-red-800"
			case "tashqarida":
				return "bg-yellow-100 text-yellow-800"
			case "ishda":
				return "bg-green-100 text-green-800"
			default:
				return "bg-gray-100 text-gray-800"
		}
	}

	const getStatusText = (status) => {
		switch (status) {
			case "kelmagan":
				return "Kelmagan"
			case "tashqarida":
				return "Tashqarida"
			case "ishda":
				return "Ishda"
			default:
				return "Nomaʼlum"
		}
	}

	// 🧩 Drag boshlandi
	const handleDragStart = (index) => {
		dragItem.current = index
	}

	// 🧩 Drag ustida
	const handleDragEnter = (index) => {
		dragOverItem.current = index
	}

	// 🧩 Drag tugaganda
	const handleDragEnd = () => {
		const copyListItems = [...filteredUsers]
		const dragItemContent = copyListItems[dragItem.current]
		copyListItems.splice(dragItem.current, 1)
		copyListItems.splice(dragOverItem.current, 0, dragItemContent)

		// Yangi lavel qiymatlarini beramiz
		const reLabeled = copyListItems.map((u, i) => ({ ...u, lavel: i + 1 }))

		setFilteredUsers(reLabeled)
		setUsers(reLabeled)
		setIsChanged(true)
		dragItem.current = null
		dragOverItem.current = null
	}

	// 💾 Saqlash tugmasi
	const handleSave = async () => {
		try {
			setSaving(true)
			const reordered = users.map((u) => ({ _id: u._id, lavel: u.lavel }))
			await axios.put(
				`${import.meta.env.VITE_BASE_URL}/api/user/reorder`,
				{ users: reordered },
				{ headers: { Authorization: `Bearer ${token}` } }
			)
			toast.success("Tartib saqlandi ✅")
			setIsChanged(false)
		} catch (err) {
			console.error(err)
			toast.error("Tartibni saqlashda xatolik ❌")
		} finally {
			setSaving(false)
		}
	}

	return (
		<div className="p-4 md:p-6 bg-gray-50 min-h-screen">
			<ToastContainer position="top-right" autoClose={3000} />

			{/* 🔍 Qidiruv va tugmalar */}
			<div className="bg-white rounded-lg border p-3 sm:p-4 mb-5 flex flex-col sm:flex-row gap-3 sm:gap-4">
				<div className="flex-1">
					<div className="relative max-w-md">
						<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
							<FiSearch size={16} />
						</div>
						<input
							type="text"
							placeholder="Xodimlarni qidirish..."
							className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-black"
							value={searchTerm}
							onChange={(e) => setSearchTerm(e.target.value)}
						/>
					</div>
				</div>

				{/* 🔁 Yangilash */}
				<button
					onClick={fetchUsers}
					disabled={refreshing}
					className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-lg flex items-center justify-center gap-2 text-sm transition"
				>
					{refreshing ? <PulseLoader size={6} color="black" /> : <FiRefreshCw size={16} />}
					<span>Yangilash</span>
				</button>

				{/* 💾 Saqlash */}
				{isChanged && (
					<button
						onClick={handleSave}
						disabled={saving}
						className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 text-sm transition"
					>
						{saving ? <PulseLoader size={6} color="white" /> : <FiSave size={16} />}
						<span>Saqlash</span>
					</button>
				)}
			</div>

			{/* 📋 Jadval */}
			<div className="bg-white rounded-xl shadow overflow-hidden">
				<div className="overflow-x-auto">
					<table className="min-w-full divide-y divide-gray-200">
						<thead className="bg-gray-50">
							<tr>
								<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Lavel</th>
								<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Xodim</th>
								<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Lavozim</th>
								<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Holati</th>
							</tr>
						</thead>

						<tbody className="bg-white divide-y divide-gray-200">
							{filteredUsers.map((user, index) => (
								<tr
									key={user._id}
									draggable
									onDragStart={() => handleDragStart(index)}
									onDragEnter={() => handleDragEnter(index)}
									onDragEnd={handleDragEnd}
									className="hover:bg-gray-50 cursor-move"
								>
									<td className="px-4 py-3 text-sm text-gray-500">{user.lavel}</td>
									<td className="px-4 py-3">
										<div className="flex items-center">
											<div className="h-10 w-10 flex-shrink-0">
												{user.photo ? (
													<img
														src={`${import.meta.env.VITE_BASE_URL}/uploads/${user.photo}`}
														alt={user.fullName}
														className="h-10 w-10 rounded-full object-cover"
													/>
												) : (
													<div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold">
														{user.fullName.charAt(0)}
													</div>
												)}
											</div>
											<div className="ml-3">
												<p className="text-sm font-medium text-gray-900">{user.fullName}</p>
												<p className="text-xs text-gray-500">{user.username}</p>
											</div>
										</div>
									</td>
									<td className="px-4 py-3 text-sm text-gray-700">{user.position}</td>
									<td className="px-4 py-3">
										<span
											className={`px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusClass(
												user.attendanceStatus
											)}`}
										>
											{getStatusText(user.attendanceStatus)}
										</span>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</div>
		</div>
	)
}

export default AdminRegulation
