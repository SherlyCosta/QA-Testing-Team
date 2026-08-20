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
                    bat 'npm test'
                 }
            }

        }
    }
}