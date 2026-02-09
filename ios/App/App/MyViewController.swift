import UIKit
import Capacitor

class MyViewController: CAPBridgeViewController {
    override open func capacitorDidLoad() {
        bridge?.registerPluginInstance(HealthKitPlugin())
        bridge?.registerPluginInstance(LocalNotifyPlugin())
        bridge?.registerPluginInstance(WidgetDataPlugin())
        bridge?.registerPluginInstance(BiometricPlugin())
        bridge?.registerPluginInstance(StoreKitPlugin())
    }
}
