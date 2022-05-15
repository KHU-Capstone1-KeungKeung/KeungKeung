# KeungKeung


## iOS 실행 방법
### 에뮬레이터 실행
```shell
npm run ios
```
## 에러해결
### `pod install` 관련 문제 발생시 체크리스트
1. `.ruby-version`에 명시된 버전의 루비 설치
- 참고링크: [How to fix rbenv: version `x.x.x` is not installed](https://gist.github.com/esteedqueen/b605cdf78b0060299322033b6a60afc3)
```shell
rbenv install x.x.x
```
2. Homebrew update 실패시
- 참고링크: [Brew Update not working after mac 10.9](https://stackoverflow.com/a/20138806/17975809)
```shell
cd `brew --prefix`/Homebrew
git fetch origin
git reset --hard origin/master
```

