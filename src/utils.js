//  Return a timestamp string
const timeStamp = () => {
	function PadZero(num) {
		return (num >= 0 && num < 10) ? "0" + num : num + "";
	}
	var now = new Date()
	return [now.getFullYear(), PadZero(now.getMonth() + 1), PadZero(now.getDate())].join("-") + "T" + [PadZero(now.getHours()), PadZero(now.getMinutes()), PadZero(now.getSeconds())].join(':') + " "
}

exports.timeStamp = timeStamp;
