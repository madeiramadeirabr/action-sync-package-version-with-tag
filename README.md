![img](https://github.com/madeiramadeirabr/action-sync-package-version-with-tag/blob/production/img/action-sync-package-version-with-tag.svg)
# action-sync-package-version-with-tag

## Description
Esta action procura a versão lançada da tag recentemente no repositório e verifica se ela atende aos seguintes padrões:

```
- v1.0.0.1
- v1.0.0
- 1.0.0.1
- 1.0.0
```

## Contexto de negócio:
Essa action é utilizada em conjunto com [`action-generate-release`](https://github.com/madeiramadeirabr/generate-release 'action-generate-release') para realizar o processo de geração de changelog
## Squad:
[SRE Team](https://github.com/orgs/madeiramadeirabr/teams/team-platform-services 'SRE Team')

## Requisitos:
- O projeto deve ser em node

## Exemplo de uso 

```yml
uses: madeiramadeirabr/action-sync-package-version-with-tag@production
with:
    github-token: ${{ secrets.GITHUB_TOKEN }}
    branch: development
```
### Or

```yml
uses: madeiramadeirabr/action-sync-package-version-with-tag@production
with:
    github-token: ${{ secrets.GITHUB_TOKEN }}
```

> Esta action também altera a versão do arquivo `package.json` da branch especificada, se nenhuma branch for especificada, ela alterará o arquivo de branch padrão
