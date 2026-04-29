import { useAuth } from "@clerk/expo";
import { Link, Redirect, useLocalSearchParams } from "expo-router";
import { View, Text } from "react-native";


const SubscriptionDetails = () => {
    const { isLoaded, isSignedIn } = useAuth();
    const { id } = useLocalSearchParams<{id: string}>();

    if (!isLoaded) return null;

    if (!isSignedIn) {
        return <Redirect href="/(auth)/sign-in" />;
    }

    return (
        <View>
            <Text>Subscription Details: {id}</Text>
            <Link href="/">Go Back</Link>
        </View>
    )
}

export default SubscriptionDetails;
