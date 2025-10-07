import axios from 'axios'
import { useEffect, useState } from 'react'
import {
	FaClock,
	FaFilter,
	FaRegCommentDots,
	FaUserCheck,
	FaUserSlash,
	FaUserTimes
} from 'react-icons/fa'
import { FiRefreshCw, FiSearch, FiX } from 'react-icons/fi'
import { PulseLoader } from 'react-spinners'
import { toast } from 'react-toastify'
const UserAttendance = () => {
	const token = localStorage.getItem('token')
	const [users, setUsers] = useState([])
	const [departments, setDepartments] = useState([])
	const [loading, setLoading] = useState(true)
	const [refreshing, setRefreshing] = useState(false)
	const [searchTerm, setSearchTerm] = useState('')
	const [selectedDepartment, setSelectedDepartment] = useState('all')
	const [selectedStatus, setSelectedStatus] = useState('all')
	const [selectedStat, setSelectedStat] = useState(null)
	const [commentModalOpen, setCommentModalOpen] = useState(false)
	const [selectedUser, setSelectedUser] = useState(null)
	const [commentText, setCommentText] = useState('')
	const [currentUserId, setCurrentUserId] = useState(null)
	const [isMobile, setIsMobile] = useState(window.innerWidth < 768)

	const [isActive, setIsActive] = useState('work-control')

	// Ekran o'lchamini kuzatish
	useEffect(() => {
		const handleResize = () => {
			setIsMobile(window.innerWidth < 768)
		}

		window.addEventListener('resize', handleResize)
		return () => window.removeEventListener('resize', handleResize)
	}, [])

	// Foydalanuvchi ID sini olish
	const fetchCurrentUserId = async () => {
		try {
			const res = await axios.get(`${import.meta.env.VITE_BASE_URL}/api/user/getuserId`, {
				headers: { Authorization: `Bearer ${token}` },
			})
			if (res.data?.success) {
				setCurrentUserId(res.data.userId)
			}
		} catch (error) {
			toast.error("Foydalanuvchi ID sini olishda xato")
		}
	}

	// Kechikkanlikni tekshirish (local vaqt bilan)
	const isLate = (checkInTime) => {
		if (!checkInTime) return false

		const localDate = new Date(checkInTime)
		const localHours = localDate.getHours()
		const localMinutes = localDate.getMinutes()

		const workStartHour = 9
		const workStartMinutes = 0

		const totalLocalMinutes = localHours * 60 + localMinutes
		const totalWorkStartMinutes = workStartHour * 60 + workStartMinutes

		const lateMinutes = totalLocalMinutes - totalWorkStartMinutes
		return lateMinutes > 5 ? lateMinutes : false
	}

	const formatTime = (isoString) => {
		if (!isoString) return '-'
		const date = new Date(isoString)

		const hours = date.getHours().toString().padStart(2, '0')
		const minutes = date.getMinutes().toString().padStart(2, '0')

		return `${hours}:${minutes}`
	}

	// Kechikkan daqiqalarni hisoblash
	const calculateLateMinutes = (checkInTime) => {
		if (!checkInTime) return 0

		try {
			const checkInDate = new Date(checkInTime)
			const localHours = checkInDate.getUTCHours() + 5
			const localMinutes = checkInDate.getUTCMinutes()

			const workStartHour = 9
			const workStartMinute = 0

			const totalCheckInMinutes = localHours * 60 + localMinutes
			const totalWorkStartMinutes = workStartHour * 60 + workStartMinute

			const lateMinutes = totalCheckInMinutes - totalWorkStartMinutes
			return lateMinutes > 0 ? lateMinutes : 0
		} catch (error) {
			return 0
		}
	}

	// Ma'lumotlarni yuklash
	const fetchData = async () => {
		try {
			setLoading(true)
			const [usersRes, deptRes] = await Promise.all([
				axios.get(`${import.meta.env.VITE_BASE_URL}/api/user/getAll`, {
					headers: { Authorization: `Bearer ${token}` },
				}),
				axios.get(`${import.meta.env.VITE_BASE_URL}/api/departament/getAll`, {
					headers: { Authorization: `Bearer ${token}` },
				})
			])

			if (!usersRes?.data?.success || !deptRes?.data?.success) {
				throw new Error("API dan noto'g'ri javob qaytdi")
			}

			const processedUsers = usersRes.data.users.map(user => {
				const status = user.attendanceStatus || 'kelmagan'
				const isUserLate = isLate(user.firstCheckInTime)

				return {
					...user,
					attendanceStatus: status,
					entryTime: formatTime(user.lastCheckInTime),
					exitTime: formatTime(user.lastCheckOutTime),
					comment: user.lastComment || '-',
					isLate: isUserLate,
					lateMinutes: isUserLate ? calculateLateMinutes(user.firstCheckInTime) : 0
				}
			})

			processedUsers.sort((a, b) => (a.lavel || 0) - (b.lavel || 0))

			setUsers(processedUsers)
			setDepartments(deptRes.data.departments)
		} catch (error) {
			toast.error("Ma'lumotlarni yuklashda xato")
		} finally {
			setLoading(false)
			setRefreshing(false)
		}
	}

	// Statistikani hisoblash
	const calculateStats = () => {
		const totalUsers = users.length

		const ishdaCount = users.filter(u => u.attendanceStatus === 'ishda').length
		const tashqaridaCount = users.filter(u => u.attendanceStatus === 'tashqarida').length
		const kelmaganCount = users.filter(u => u.attendanceStatus === 'kelmagan' || !['ishda', 'tashqarida'].includes(u.attendanceStatus)).length
		const kechikkanCount = users.filter(u => u.isLate).length

		return {
			total: totalUsers,
			ishda: {
				count: ishdaCount,
				percentage: totalUsers > 0 ? Math.round((ishdaCount / totalUsers) * 100) : 0,
				filter: () => setSelectedStat('ishda')
			},
			tashqarida: {
				count: tashqaridaCount,
				percentage: totalUsers > 0 ? Math.round((tashqaridaCount / totalUsers) * 100) : 0,
				filter: () => setSelectedStat('tashqarida')
			},
			kelmagan: {
				count: kelmaganCount,
				percentage: totalUsers > 0 ? Math.round((kelmaganCount / totalUsers) * 100) : 0,
				filter: () => setSelectedStat('kelmagan')
			},
			kechikkan: {
				count: kechikkanCount,
				percentage: totalUsers > 0 ? Math.round((kechikkanCount / totalUsers) * 100) : 0,
				filter: () => setSelectedStat('kechikkan')
			}
		}
	}

	const stats = calculateStats()

	// Status uchun ikonkalar
	const getStatusIcon = (status) => {
		switch (status) {
			case 'ishda': return <FaUserCheck className="text-emerald-500" />
			case 'kelmagan': return <FaUserTimes className="text-rose-500" />
			case 'tashqarida': return <FaUserSlash className="text-blue-500" />
			default: return <FaUserTimes className="text-rose-500" />
		}
	}

	// Status ranglari
	const getStatusColor = (status) => {
		switch (status) {
			case 'ishda': return 'bg-emerald-100 text-emerald-800'
			case 'kelmagan': return 'bg-rose-100 text-rose-800'
			case 'tashqarida': return 'bg-blue-100 text-blue-800'
			default: return 'bg-rose-100 text-rose-800'
		}
	}

	// Status matnlari
	const getStatusText = (status) => {
		switch (status) {
			case 'ishda': return 'Ishda'
			case 'kelmagan': return 'Kelmadi'
			case 'tashqarida': return 'Tashqarida'
			default: return 'Kelmadi'
		}
	}

	// Kommentariya modalini ochish
	const openCommentModal = (user) => {
		if (currentUserId && user._id === currentUserId && user.attendanceStatus === 'ishda') {
			setSelectedUser(user)
			setCommentText(user.comment || '')
			setCommentModalOpen(true)
		}
	}

	// Kommentariyani yuborish
	const handleCommentSubmit = async () => {
		if (!selectedUser?.lastLogId) {
			toast.error("Foydalanuvchi tanlanmagan yoki log ID mavjud emas")
			return
		}

		try {
			const res = await axios.put(
				`${import.meta.env.VITE_BASE_URL}/api/user/comment/${selectedUser.lastLogId}`,
				{ comment: commentText },
				{ headers: { Authorization: `Bearer ${token}` } }
			)

			if (res.data?.success) {
				toast.success("Komentariya saqlandi!")
				fetchData()
				setCommentModalOpen(false)
			} else {
				throw new Error("Noto'g'ri javob formati")
			}
		} catch (error) {
			toast.error("Komentariyani saqlashda xatolik")
		}
	}

	// Foydalanuvchilarni filtrlash
	const filteredUsers = users.filter(user => {
		const matchesSearch =
			user.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
			user.position?.toLowerCase().includes(searchTerm.toLowerCase()) ||
			user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
			user.hodimID?.toLowerCase().includes(searchTerm.toLowerCase())

		const matchesDepartment =
			selectedDepartment === 'all' ||
			(selectedDepartment === 'no-dept' && !user.department) ||
			user.department?._id === selectedDepartment

		const matchesStatus =
			selectedStatus === 'all' ||
			user.attendanceStatus === selectedStatus ||
			(selectedStatus === 'kelmagan' && !['ishda', 'tashqarida'].includes(user.attendanceStatus))

		const matchesStat = !selectedStat ||
			(selectedStat === 'ishda' && user.attendanceStatus === 'ishda') ||
			(selectedStat === 'tashqarida' && user.attendanceStatus === 'tashqarida') ||
			(selectedStat === 'kelmagan' && (user.attendanceStatus === 'kelmagan' || !['ishda', 'tashqarida'].includes(user.attendanceStatus))) ||
			(selectedStat === 'kechikkan' && user.isLate)

		return matchesSearch && matchesDepartment && matchesStatus && matchesStat
	})

	// Statistik filterlarni tozalash
	const clearStatFilter = () => {
		setSelectedStat(null)
	}

	useEffect(() => {
		fetchCurrentUserId()
		fetchData()
	}, [])

	// Mobil card ko'rinishi - TO'G'RILANGAN VERSIYA
	const renderMobileCards = () => {
		return (
			<div className="p-2 space-y-2 overflow-y-auto max-h-[calc(100vh-120px)]">

				{filteredUsers.map((user, index) => (
					<div
						key={user._id}
						className={`
						bg-white rounded-lg shadow-sm border p-3
						${!user.attendanceStatus || user.attendanceStatus === 'kelmagan'
								? 'border-red-200'
								: user.attendanceStatus === 'ishda'
									? 'border-green-200'
									: 'border-blue-200'
							}
					`}
					>
						{/* Card header - User info */}
						<div className="flex items-center justify-between mb-3">
							<div className="flex items-center space-x-3">
								<div className="flex-shrink-0 h-12 w-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold">
									{user.photo ? (
										<img
											src={`${import.meta.env.VITE_BASE_URL}/uploads/${user.photo}`}
											alt={user.fullName}
											className="h-full w-full rounded-full object-cover"
											onError={(e) => {
												e.target.onerror = null
												e.target.parentElement.textContent = user.fullName?.charAt(0)?.toUpperCase()
											}}
										/>
									) : (
										user.fullName?.charAt(0)?.toUpperCase()
									)}
								</div>
								<div>
									<p className="font-medium text-gray-900 text-sm">{user.fullName}</p>
									<p className="text-xs text-gray-500">{user.position || '-'}</p>
								</div>
							</div>
							<div className="text-right">
								<div className="flex items-center justify-end space-x-1">
									<span className="text-xs text-gray-500">#{index + 1}</span>
									{user.isLate && (
										<span className="text-yellow-500" title={`${user.lateMinutes} daqiqa kechikkan`}>
											<FaClock size={12} />
										</span>
									)}
								</div>
								<div className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium mt-1 ${getStatusColor(user.attendanceStatus)}`}>
									{getStatusIcon(user.attendanceStatus)}
									<span className="ml-1">
										{getStatusText(user.attendanceStatus)}
									</span>
								</div>
							</div>
						</div>

						{/* Card body - Details */}
						<div className="grid grid-cols-2 gap-3 text-xs">
							{/* Telefon */}
							<div className="col-span-2">
								<span className="text-gray-500">Telefon:</span>
								<p className="font-medium mt-1">
									{user.phone_personal || user.phone_work
										? `${user.phone_personal || ''}${user.phone_personal && user.phone_work ? ' / ' : ''}${user.phone_work || ''}`
										: '-'}
								</p>
							</div>

							{/* Kirish vaqti */}
							<div>
								<span className="text-gray-500">Kirish vaqti:</span>
								<p className="font-medium text-black mt-1">{user.entryTime}</p>
							</div>

							{/* Chiqish vaqti */}
							<div>
								<span className="text-gray-500">Chiqish vaqti:</span>
								<p className="font-medium text-black mt-1">{user.exitTime}</p>
							</div>

							{/* Kechikish (agar mavjud bo'lsa) */}
							{user.isLate && (
								<div className="col-span-2">
									<span className="text-gray-500">Kechikish:</span>
									<p className="font-medium text-black mt-1">
										{user.lateMinutes} daqiqa
									</p>
								</div>
							)}

							{/* Izoh */}
							<div className="col-span-2">
								<div className="flex items-start justify-between">
									<div className="flex-1">
										<span className="text-gray-500">Izoh:</span>
										<p className="font-medium text-black mt-1 break-words">{user.comment}</p>
									</div>
									{currentUserId && user._id === currentUserId && user.attendanceStatus === 'ishda' && (
										<button
											onClick={() => openCommentModal(user)}
											className="ml-2 text-gray-400 hover:text-blue-500 flex-shrink-0 mt-5"
											title="Komentariya qo'shish"
										>
											<FaRegCommentDots size={14} />
										</button>
									)}
								</div>
							</div>
						</div>
					</div>
				))}
			</div>
		)
	}

	// Desktop table ko'rinishi - TO'G'RILANGAN VERSIYA
	const renderDesktopTable = () => {
		return (
			<div className="h-full flex flex-col overflow-hidden">
				{/* Bitta table ichida header va body */}
				<div className="flex-1 min-h-0 overflow-auto">
					<table className="w-full">
						{/* Sticky header */}
						<thead className="sticky top-0 z-20 bg-gray-50">
							<tr>
								<th className="px-4 py-4 text-left text-sm font-medium text-gray-500 tracking-wider whitespace-nowrap w-[80px] sticky left-0 bg-gray-50 z-30">
									№
								</th>
								<th className="px-4 py-4 text-left text-sm font-medium text-gray-500 tracking-wider whitespace-nowrap min-w-[200px] sticky left-[80px] bg-gray-50 z-20">
									Xodim
								</th>
								<th className="px-4 py-4 text-left text-sm font-medium text-gray-500 tracking-wider whitespace-nowrap min-w-[150px]">
									Lavozim
								</th>
								<th className="px-4 py-4 text-left text-sm font-medium text-gray-500 tracking-wider whitespace-nowrap min-w-[150px]">
									Telefon
								</th>
								<th className="px-4 py-4 text-left text-sm font-medium text-gray-500 tracking-wider whitespace-nowrap min-w-[100px]">
									Kirish
								</th>
								<th className="px-4 py-4 text-left text-sm font-medium text-gray-500 tracking-wider whitespace-nowrap min-w-[100px]">
									Chiqish
								</th>
								<th className="px-4 py-4 text-left text-sm font-medium text-gray-500 tracking-wider whitespace-nowrap min-w-[200px]">
									Izoh
								</th>
								<th className="px-4 py-4 text-left text-sm font-medium text-gray-500 tracking-wider whitespace-nowrap min-w-[120px]">
									Holat
								</th>
							</tr>
						</thead>

						{/* Body */}
						<tbody className="divide-y divide-gray-200 bg-white">
							{filteredUsers.map((user, index) => (
								<tr key={user._id} className={`
								hover:bg-opacity-90 group
								${!user.attendanceStatus || user.attendanceStatus === 'kelmagan'
										? 'bg-red-50 hover:bg-red-100'
										: user.attendanceStatus === 'ishda'
											? 'bg-green-50 hover:bg-green-100'
											: 'bg-blue-50 hover:bg-blue-100'
									}
							`}>
									{/* Sticky columns */}
									<td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 sticky left-0 z-10 min-w-[80px] bg-inherit">
										<div className="flex items-center">
											{index + 1}
											{user.isLate && (
												<span className="ml-2 text-yellow-500" title={`${user.lateMinutes} daqiqa kechikkan`}>
													<FaClock className="inline" size={12} />
												</span>
											)}
										</div>
									</td>

									<td className="px-4 py-4 min-w-[200px] sticky left-[80px] z-10 bg-inherit">
										<div className="flex items-center">
											<div className="flex-shrink-0 h-16 w-16 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold">
												{user.photo ? (
													<img
														src={`${import.meta.env.VITE_BASE_URL}/uploads/${user.photo}`}
														alt={user.fullName}
														className="h-full w-full rounded-full object-cover"
														onError={(e) => {
															e.target.onerror = null
															e.target.parentElement.textContent = user.fullName?.charAt(0)?.toUpperCase()
														}}
													/>
												) : (
													user.fullName?.charAt(0)?.toUpperCase()
												)}
											</div>
											<div className="ml-3">
												<p className="text-sm font-medium text-gray-900">
													{user.fullName}
												</p>
											</div>
										</div>
									</td>

									{/* Qolgan ustunlar */}
									<td className="px-4 py-4 text-sm text-gray-900 min-w-[150px]">
										{user.position || '-'}
									</td>
									<td className="px-4 py-4 text-sm text-gray-900 min-w-[150px]">
										{user.phone_personal || user.phone_work
											? `${user.phone_personal || ''}${user.phone_personal && user.phone_work ? ' (' : ''}${user.phone_work || ''}${user.phone_personal && user.phone_work ? ')' : ''}`
											: '-'}
									</td>
									<td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 min-w-[100px]">
										{user.entryTime}
									</td>
									<td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 min-w-[100px]">
										{user.exitTime}
									</td>
									<td className="px-4 py-4 text-sm text-gray-900 whitespace-normal break-words min-w-[200px] max-w-xs">
										<div className="flex items-center">
											<span className="flex-1">{user.comment}</span>
											{currentUserId && user._id === currentUserId && user.attendanceStatus === 'ishda' && (
												<button
													onClick={() => openCommentModal(user)}
													className="ml-2 text-gray-400 hover:text-blue-500 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
													title="Komentariya qo'shish"
												>
													<FaRegCommentDots size={14} />
												</button>
											)}
										</div>
									</td>
									<td className="px-4 py-4 whitespace-nowrap min-w-[120px]">
										<div className="flex items-center">
											<span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(user.attendanceStatus)}`}>
												{getStatusIcon(user.attendanceStatus)}
												<span className="ml-1.5">
													{getStatusText(user.attendanceStatus)}
												</span>
											</span>
										</div>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>

				{/* Table footer */}
				<div className="flex-shrink-0 bg-gray-50 px-6 py-3 border-t">
					<p className="text-sm text-gray-600">
						Jami: {filteredUsers.length} ta xodim
					</p>
				</div>
			</div>
		)
	}

	const renderStatistics = () => {
		return (
			<div className="relative flex-shrink-0 bg-white p-2 sm:p-3 lg:p-4 shadow-sm w-full rounded-xl">
				{/* Statistikalar - ixcham grid */}
				<div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 lg:gap-4 mb-3">
					{/* Ishda bo'lganlar */}
					<div
						className={`bg-white rounded-lg border p-2 sm:p-3 lg:p-4 flex items-center justify-between cursor-pointer transition-all duration-300 hover:shadow-md ${selectedStat === "ishda"
							? "ring-2 ring-emerald-200 border-emerald-500 shadow-md transform scale-102"
							: "border-emerald-100 hover:border-emerald-300"
							}`}
						onClick={() =>
							selectedStat === "ishda"
								? clearStatFilter()
								: stats.ishda.filter()
						}
					>
						<div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
							<div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
								<FaUserCheck className="text-emerald-600 w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6" />
							</div>
							<div className="min-w-0 flex-1">
								<p className="text-xs sm:text-sm font-semibold text-gray-600 truncate">
									Ishda
								</p>
								<p className="text-lg sm:text-xl font-bold text-emerald-600 truncate">
									{stats.ishda.count}
								</p>
							</div>
						</div>
						<div className="text-right flex-shrink-0 ml-2">
							<p className="text-sm font-bold text-emerald-600">
								{stats.ishda.percentage}%
							</p>
						</div>
					</div>

					{/* Kelmaganlar */}
					<div
						className={`bg-white rounded-lg border p-2 sm:p-3 lg:p-4 flex items-center justify-between cursor-pointer transition-all duration-300 hover:shadow-md ${selectedStat === "kelmagan"
							? "ring-2 ring-rose-200 border-rose-500 shadow-md transform scale-102"
							: "border-rose-100 hover:border-rose-300"
							}`}
						onClick={() =>
							selectedStat === "kelmagan"
								? clearStatFilter()
								: stats.kelmagan.filter()
						}
					>
						<div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
							<div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 bg-rose-100 rounded-xl flex items-center justify-center">
								<FaUserTimes className="text-rose-600 w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6" />
							</div>
							<div className="min-w-0 flex-1">
								<p className="text-xs sm:text-sm font-semibold text-gray-600 truncate">
									Kelmagan
								</p>
								<p className="text-lg sm:text-xl font-bold text-rose-600 truncate">
									{stats.kelmagan.count}
								</p>
							</div>
						</div>
						<div className="text-right flex-shrink-0 ml-2">
							<p className="text-sm font-bold text-rose-600">
								{stats.kelmagan.percentage}%
							</p>
						</div>
					</div>

					{/* Tashqarida bo'lganlar */}
					<div
						className={`bg-white rounded-lg border p-2 sm:p-3 lg:p-4 flex items-center justify-between cursor-pointer transition-all duration-300 hover:shadow-md ${selectedStat === "tashqarida"
							? "ring-2 ring-blue-200 border-blue-500 shadow-md transform scale-102"
							: "border-blue-100 hover:border-blue-300"
							}`}
						onClick={() =>
							selectedStat === "tashqarida"
								? clearStatFilter()
								: stats.tashqarida.filter()
						}
					>
						<div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
							<div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 bg-blue-100 rounded-xl flex items-center justify-center">
								<FaUserSlash className="text-blue-600 w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6" />
							</div>
							<div className="min-w-0 flex-1">
								<p className="text-xs sm:text-sm font-semibold text-gray-600 truncate">
									Tashqarida
								</p>
								<p className="text-lg sm:text-xl font-bold text-blue-600 truncate">
									{stats.tashqarida.count}
								</p>
							</div>
						</div>
						<div className="text-right flex-shrink-0 ml-2">
							<p className="text-sm font-bold text-blue-600">
								{stats.tashqarida.percentage}%
							</p>
						</div>
					</div>

					{/* Kechikkanlar */}
					<div
						className={`bg-white rounded-lg border p-2 sm:p-3 lg:p-4 flex items-center justify-between cursor-pointer transition-all duration-300 hover:shadow-md ${selectedStat === "kechikkan"
							? "ring-2 ring-yellow-200 border-yellow-500 shadow-md transform scale-102"
							: "border-yellow-100 hover:border-yellow-300"
							}`}
						onClick={() =>
							selectedStat === "kechikkan"
								? clearStatFilter()
								: stats.kechikkan.filter()
						}
					>
						<div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
							<div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
								<FaClock className="text-yellow-600 w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6" />
							</div>
							<div className="min-w-0 flex-1">
								<p className="text-xs sm:text-sm font-semibold text-gray-600 truncate">
									Kechikkan
								</p>
								<p className="text-lg sm:text-xl font-bold text-yellow-600 truncate">
									{stats.kechikkan.count}
								</p>
							</div>
						</div>
						<div className="text-right flex-shrink-0 ml-2">
							<p className="text-sm font-bold text-yellow-600">
								{stats.kechikkan.percentage}%
							</p>
						</div>
					</div>
				</div>

				{/* 🧹 Kichik tozalash tugmasi - suzuvchi */}
				{/* {selectedStat && (
					<button
						onClick={clearStatFilter}
						title="Filterni tozalash"
						className="absolute top-2 right-2 bg-white border shadow-sm hover:shadow-md rounded-full p-1.5 text-gray-500 hover:text-red-500 transition-all duration-200"
					>
						<FiX size={16} />
					</button>
				)} */}
			</div>
		)
	}

	return (
		<div className="h-screen flex flex-col w-full max-w-full overflow-hidden">
			<div className="flex-1 flex flex-col min-h-0 bg-gray-50 w-full max-w-full">
				{/* Statistics section */}
				{renderStatistics()}

				{/* Filters and table section - Takes remaining space */}
				<div className="flex-1 min-h-0 flex flex-col">
					{/* Filters section */}
					<div className="flex-shrink-0 bg-white p-3 sm:p-4 shadow-sm">
						<div className="bg-white rounded-lg border p-3 sm:p-4">
							<div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
								{/* 🔍 Qidiruv maydoni */}
								<div className="flex-1">
									<div className="relative max-w-md">
										<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
											<FiSearch size={16} />
										</div>
										<input
											type="text"
											placeholder="Xodimlarni qidirish..."
											className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm text-black"
											value={searchTerm}
											onChange={(e) => setSearchTerm(e.target.value)}
										/>
									</div>
								</div>

								{/* 🧩 Filterlar guruhi */}
								<div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
									{/* 🏢 Bo'lim filteri */}
									<div className="flex-1 sm:flex-none">
										<div
											className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 transition-colors px-3 py-2 rounded-lg border cursor-pointer h-full min-w-[130px] max-w-[200px]"
											onClick={() => setSelectedDepartment("all")} // Cardni bosganda tozalaydi
											title="Bo‘lim filtrini tozalash uchun bosing"
										>
											<FaFilter className="text-gray-500 flex-shrink-0" size={14} />
											<select
												className="bg-transparent text-gray-800 border-none focus:outline-none focus:ring-0 text-sm w-full truncate"
												value={selectedDepartment}
												onChange={(e) => setSelectedDepartment(e.target.value)}
												onClick={(e) => e.stopPropagation()} // Select bosilganda card bosilmasin
											>
												<option value="all">Barcha bo'limlar</option>
												{departments.map((dept) => (
													<option key={dept._id} value={dept._id}>
														{dept.name}
													</option>
												))}
												<option value="no-dept">Boʻlimsiz</option>
											</select>
										</div>
									</div>

									{/* ⚙️ Holat filteri */}
									<div className="flex-1 sm:flex-none">
										<div
											className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 transition-colors px-3 py-2 rounded-lg border cursor-pointer h-full min-w-[130px] max-w-[180px]"
											onClick={() => setSelectedStatus("all")} // Cardni bosganda tozalaydi
											title="Holat filtrini tozalash uchun bosing"
										>
											<FaFilter className="text-gray-500 flex-shrink-0" size={14} />
											<select
												className="bg-transparent text-gray-800 border-none focus:outline-none focus:ring-0 text-sm w-full truncate"
												value={selectedStatus}
												onChange={(e) => setSelectedStatus(e.target.value)}
												onClick={(e) => e.stopPropagation()}
											>
												<option value="all">Barcha holat</option>
												<option value="ishda">Ishda</option>
												<option value="kelmagan">Kelmagan</option>
												<option value="tashqarida">Tashqarida</option>
											</select>
										</div>
									</div>

									{/* 🔄 Yangilash tugmasi */}
									<div className="flex-1 sm:flex-none">
										<button
											onClick={() => {
												setRefreshing(true)
												fetchData()
											}}
											disabled={refreshing}
											className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 text-sm w-full h-full transition-colors duration-200 font-medium"
											title="Maʼlumotlarni yangilash"
										>
											{refreshing ? (
												<PulseLoader size={6} color="white" />
											) : (
												<>
													<FiRefreshCw size={16} />
													<span>Yangilash</span>
												</>
											)}
										</button>
									</div>
								</div>
							</div>
						</div>

					</div>

					{/* Content container - Takes remaining space */}
					<div className="flex-1 min-h-0 flex flex-col overflow-hidden">
						{loading ? (
							<div className="flex justify-center items-center h-full py-8">
								<PulseLoader color="#6366F1" size={16} />
							</div>
						) : filteredUsers.length === 0 ? (
							<div className="text-center py-12 h-full flex items-center justify-center">
								<div className="px-6">
									<div className="mx-auto h-24 w-24 text-gray-400 mb-4">
										<FaUserTimes className="w-full h-full" />
									</div>
									<h3 className="text-lg font-medium text-gray-900">Xodimlar topilmadi</h3>
									<p className="text-base text-gray-500 mt-2">
										{searchTerm ? "Qidiruv bo'yicha xodim topilmadi" : "Tizimda xodimlar mavjud emas"}
									</p>
								</div>
							</div>
						) : (
							<>
								{/* Mobile view - Cards */}
								{isMobile ? (
									renderMobileCards()
								) : (
									/* Desktop view - Table */
									renderDesktopTable()
								)}
							</>
						)}
					</div>
				</div>

				{/* Kommentariya Modali */}
				{commentModalOpen && (
					<div className="fixed inset-0 z-50 flex items-center justify-center p-4">
						<div className="fixed inset-0 backdrop-blur-sm  bg-opacity-30" onClick={() => setCommentModalOpen(false)}></div>
						<div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md mx-auto z-10">
							<div className="p-6">
								<div className="flex justify-between items-center mb-4">
									<h3 className="text-lg font-bold text-gray-800">
										Chiqish sababi
									</h3>
									<button
										onClick={() => setCommentModalOpen(false)}
										className="text-gray-500 hover:text-gray-700 transition-colors duration-200"
									>
										<FiX size={20} />
									</button>
								</div>
								<textarea
									className="w-full p-3 border border-gray-300 text-black rounded-lg mb-4 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm resize-none"
									rows={4}
									value={commentText}
									onChange={(e) => setCommentText(e.target.value)}
									placeholder="Komentariya yozing..."
								/>
								<div className="flex justify-end gap-3">
									<button
										className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 text-sm font-medium transition-colors duration-200"
										onClick={() => setCommentModalOpen(false)}
									>
										Bekor qilish
									</button>
									<button
										className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium transition-colors duration-200"
										onClick={handleCommentSubmit}
									>
										Saqlash
									</button>
								</div>
							</div>
						</div>
					</div>
				)}
			</div>
		</div>
	)
}

export default UserAttendance