# react-native-resquircle

[CI](https://github.com/wS9w/react-native-resquircle/actions/workflows/ci.yml)

High-performance native squircle (superellipse) implementation for React Native on iOS and Android.

**Requires React Native 0.80+.** The library auto-detects your RN version and adapts the native build config (Gradle, Kotlin, iOS deployment target) accordingly.

## Requirements

- React Native **0.80+**
- iOS 15.1+ / Android API 24+

The library auto-detects your RN version and uses compatible Gradle/Kotlin settings.

## Installation

```sh
npm install react-native-resquircle
```

## Usage

```js
import { SquircleView } from "react-native-resquircle";

// ...

<SquircleView style={{ backgroundColor: "tomato" }} />
```

## Contributing

- [Development workflow](CONTRIBUTING.md#development-workflow)
- [Sending a pull request](CONTRIBUTING.md#sending-a-pull-request)
- [Code of conduct](CODE_OF_CONDUCT.md)

## License

MIT

---

Made with [create-react-native-library](https://github.com/callstack/react-native-builder-bob)