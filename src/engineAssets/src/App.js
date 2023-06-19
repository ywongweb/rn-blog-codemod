"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.App = void 0;
var react_1 = __importDefault(require("react"));
var react_native_1 = require("react-native");
var styles = react_native_1.StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
    },
    text: {
        textAlign: 'center',
        color: 'blue',
        fontSize: 32,
    },
});
var App = function () {
    return (<react_native_1.View style={styles.container}>
      <react_native_1.Text style={styles.text}>Hello world from native repo example app</react_native_1.Text>
    </react_native_1.View>);
};
exports.App = App;
//# sourceMappingURL=App.js.map