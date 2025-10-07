const checkSekret = (req, res, next) => {
	const secret = req.headers["authorization"] // headerdan olish

	if (secret === "SalomBaxtinurAka") {
		return next()
	}

	return res.status(403).json({
		success: false,
		message: "Unauthorized: invalid secret key",
	})
}


module.exports = checkSekret