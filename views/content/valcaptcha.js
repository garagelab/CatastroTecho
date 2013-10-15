// # <?php
// # session_start();
// # 
// # function rpHash($value) {
// # 	$hash = 5381;
// # 	$value = strtoupper($value);
// # 	for($i = 0; $i < strlen($value); $i++) {
// # 		$hash = (($hash << 5) + $hash) + ord(substr($value, $i));
// # 	}
// # 	return $hash;
// # }
// # (rpHash($_POST['captcha']) == $_POST['defaultRealHash'])?echo 'true':echo 'false';

(function(){
	return true;
// Close off the anonymous function and execute it
})();
