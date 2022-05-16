# KeungKeung


## iOS 실행 방법
### 에뮬레이터 실행
```shell
npm run ios
```
## 에러해결
### `pod install` 관련 문제 발생시 체크리스트
1. `.ruby-version`에 명시된 버전의 루비 설치

참고링크: [How to fix rbenv: version `x.x.x` is not installed](https://gist.github.com/esteedqueen/b605cdf78b0060299322033b6a60afc3)
```shell
rbenv install x.x.x
```
2. Homebrew update 실패시

참고링크: [Brew Update not working after mac 10.9](https://stackoverflow.com/a/20138806/17975809)
```shell
cd `brew --prefix`/Homebrew
git fetch origin
git reset --hard origin/master
```
3. 에뮬레이터를 찾지 못할 시

발생에러: `error: SDK "iphoneos" cannot be located`
참고링크: [error: unable to lookup item 'Path' in SDK 'iphoneos'](https://codechef.tistory.com/entry/react-native-%ED%94%84%EB%A1%9C%EC%A0%9D%ED%8A%B8-%EC%B4%88%EA%B8%B0-%EC%84%A4%EC%B9%98-%ED%9B%84-error-unable-to-lookup-item-Path-in-SDK-iphoneos-%EA%B0%84%EB%8B%A8-%ED%95%B4%EA%B2%B0-%EB%B0%A9%EB%B2%95)
```shell
sudo xcode-select --switch /Applications/Xcode.app
```



