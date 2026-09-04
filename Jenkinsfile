pipeline {
    agent any

    environment {
        // Points Jenkins to your Windows Node.js installation
        PATH = "C:\\Program Files\\nodejs;${env.PATH}"
    }

    parameters {
        choice(
            name: 'TEST_SUITE',
            choices: ['All', 'Auth', 'Product', 'Cart', 'Happy_Path_E2E'],
            description: 'Select the Playwright test suite to execute.'
        )
        choice(
            name: 'BROWSER',
            choices: ['All', 'Chromium', 'Firefox', 'WebKit'],
            description: 'Select the browser in which to execute the Playwright tests.'
        )
        gitParameter(
            name: 'BRANCH',
            type: 'PT_BRANCH',
            defaultValue: 'main',
            description: 'Select branch to execute tests against.',
            sortMode: 'ASCENDING_SMART'
        )
        string(
            name: 'ENVIRONMENT',
            defaultValue: 'staging',
            description: 'Target environment to execute tests against (e.g., staging, dev, production).'
        )
    }

    stages {

        stage('Checkout') {
            steps {
                checkout([
                    $class: 'GitSCM',
                    branches: [[name: "${params.BRANCH}"]],
                    userRemoteConfigs: scm.userRemoteConfigs
                ])
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
                    withEnv([
                        "TEST_SUITE=${params.TEST_SUITE}",
                        "BROWSER=${params.BROWSER}",
                        "BRANCH=${params.BRANCH}",
                        "ENVIRONMENT=${params.ENVIRONMENT}",
                        "TARGET_ENV=${params.ENVIRONMENT}",
                        "BUILD_NUMBER=${env.BUILD_NUMBER ?: ''}",
                        "JOB_NAME=${env.JOB_NAME ?: ''}",
                        "BUILD_URL=${env.BUILD_URL ?: ''}"
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

                            // Injects build parameters so Playwright and reports reflect exact Jenkins parameters
                            def envPrefix = "set TEST_SUITE=${params.TEST_SUITE}&& set BROWSER=${params.BROWSER}&& set BRANCH=${params.BRANCH}&& set ENVIRONMENT=${params.ENVIRONMENT}&& set TARGET_ENV=${params.ENVIRONMENT}&& set BUILD_NUMBER=${env.BUILD_NUMBER ?: ''}&& "

                            if (params.BROWSER == 'All') {
                                bat "${envPrefix}${testCommand}"
                            } else if (params.BROWSER == 'Chromium') {
                                bat "${envPrefix}${testCommand} --project=chromium"
                            } else if (params.BROWSER == 'Firefox') {
                                bat "${envPrefix}${testCommand} --project=firefox"
                            } else if (params.BROWSER == 'WebKit') {
                                bat "${envPrefix}${testCommand} --project=webkit"
                            }
                        }
                    }
                }
            }
        }
        
    }
    post {
        always {

            //generate the pdf report regardless tests pass/fail.
            bat "set TEST_SUITE=${params.TEST_SUITE}&& set BROWSER=${params.BROWSER}&& set BRANCH=${params.BRANCH}&& set ENVIRONMENT=${params.ENVIRONMENT}&& set TARGET_ENV=${params.ENVIRONMENT}&& set BUILD_NUMBER=${env.BUILD_NUMBER ?: ''}&& npx tsx scripts/generate-pdf.ts"

            archiveArtifacts artifacts: 'playwright-report/**, playwright-custom-report/**, playwright-custom-report/test-report.pdf', allowEmptyArchive: true

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