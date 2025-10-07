require('dotenv').config()
const mongoose = require('mongoose')
const User = require('./models/user.model') // model yo‘li sizga mos bo‘lishi kerak
const bcrypt = require('bcrypt')

const MONGO_URI = 'mongodb://localhost:27017/facecontrol'

async function addAdmin() {
	try {
		await mongoose.connect(MONGO_URI)

		// parolni hash qilamiz
		const hashedPassword = await bcrypt.hash('admin', 10)

		const adminUser = new User({
			fullName: 'Super Admin',
			position: 'Administrator',
			username: 'admin',
			password: hashedPassword,
			role: 'admin',
			hodimID: '000001',
			lavel:0
		})

		const savedUser = await adminUser.save()
		console.log('Admin qo‘shildi:', savedUser)

		mongoose.connection.close()
	} catch (error) {
		console.error('Xatolik yuz berdi:', error)
		mongoose.connection.close()
	}
}

addAdmin()
