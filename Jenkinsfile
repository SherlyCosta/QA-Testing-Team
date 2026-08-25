pipeline {
    agent any

    stages {

        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Install Dependencies') {
            steps {
                bat 'npm ci'
            }
        }

        stage('Install Playwright Browsers') {
            steps {
                bat 'npx playwright install'
            }
        }

         stage('Run Tests') {
            steps {
                withCredentials([
                    usernamePassword(
                        credentialsId: 'playwright-test-user',
                        usernameVariable: 'TEST_USER_EMAIL',
                        passwordVariable: 'TEST_USER_PASSWORD'
                    )
                ]) {
                    script {

                        def testCommand

                        if (params.TEST_SUITE == 'All') {
                            testCommand = 'npx playwright test'
                        } else if (params.TEST_SUITE == 'Auth') {
                            testCommand = 'npm run test:auth'
                        } else if (params.TEST_SUITE == 'Product') {
                            testCommand = 'npm run test:product'
                        } else if (params.TEST_SUITE == 'Cart') {
                            testCommand = 'npm run test:cart'
                        } else if (params.TEST_SUITE == 'Happy_Path_E2E') {
                            testCommand = 'npm run test tests/happy-path-e2e.spec.ts'
                        }

                        if (params.BROWSER == 'All') {
                            bat testCommand
                        } else if (params.BROWSER == 'Chromium') {
                            bat "${testCommand} --project=chromium"
                        } else if (params.BROWSER == 'Firefox') {
                            bat "${testCommand} --project=firefox"
                        } else if (params.BROWSER == 'WebKit') {
                            bat "${testCommand} --project=webkit"
                        }
                    }
                }
            }
        }
    }
   post {
    always {
        archiveArtifacts artifacts: 'playwright-report/**, playwright-custom-report/**',
            allowEmptyArchive: true

        publishHTML([
            allowMissing: true,
            alwaysLinkToLastBuild: true,
            keepAll: true,
            reportDir: 'playwright-report',
            reportFiles: 'index.html',
            reportName: 'Playwright HTML Report'
        ])

        publishHTML([
            allowMissing: true,
            alwaysLinkToLastBuild: true,
            keepAll: true,
            reportDir: 'playwright-custom-report',
            reportFiles: 'dashboard.html',
            reportName: 'Custom Dashboard Report'
        ])
    }
  }
}
