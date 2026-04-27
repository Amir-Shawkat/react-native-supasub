import { View, Text } from "react-native";
import { Link } from "expo-router";

const SignIn = () => {
    return (
        <View>
            <Text>SignIn</Text>
            <Link href="/(auth)/sign-up">Create An Account</Link>
            <Link href="/">Go to Home</Link>
        </View>
    )
}

export default SignIn;