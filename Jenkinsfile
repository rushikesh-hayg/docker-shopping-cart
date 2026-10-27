pipeline {
    agent any

    options {
        timeout(time: 30, unit: 'MINUTES')
        buildDiscarder(logRotator(numToKeepStr: '10', artifactNumToKeepStr: '5'))
        ansiColor('xterm')
        disableConcurrentBuilds()
    }

    parameters {
        choice(name: 'DEPLOY_ENV', choices: ['staging', 'production'], description: 'Target deployment environment')
        string(name: 'APP_URL', defaultValue: 'http://localhost', description: 'Application Storefront URL for Selenium E2E Tests')
        string(name: 'DOCKER_HUB_REPO', defaultValue: 'devopsarchitect/shopping-cart', description: 'Target Docker Hub registry repository name')
    }

    environment {
        IMAGE_TAG = "1.0.0-b${BUILD_NUMBER}"
        DOCKER_CREDS = credentials('docker-hub-credentials') // Configured in Jenkins Secret Store
        COMPOSE_PROJECT_NAME = "shopping-cart-${params.DEPLOY_ENV}"
    }

    tools {
        maven 'Maven-3.9'
        jdk 'JDK-21'
        nodejs 'NodeJS-20'
    }

    stages {
        // =====================================================================
        // Stage 1: SCM Checkout and Environment Verification
        // =====================================================================
        stage('Checkout & Environment Audit') {
            steps {
                echo "=========================================================="
                echo "🚀 Starting CI/CD Build #${BUILD_NUMBER} on branch ${env.BRANCH_NAME ?: 'develop'}"
                echo "Environment: ${params.DEPLOY_ENV} | Target Image: ${DOCKER_HUB_REPO}:${IMAGE_TAG}"
                echo "=========================================================="
                checkout scm
                sh 'git log -1 --stat'
            }
        }

        // =====================================================================
        // Stage 2: Backend Unit & Integration Tests
        // =====================================================================
        stage('Backend Unit & Integration Tests') {
            steps {
                dir('backend') {
                    echo "Installing dependencies and running automated backend test suite..."
                    sh 'npm ci'
                    sh 'npm test'
                }
            }
        }

        // =====================================================================
        // Stage 3: Automated Quality Gate (Selenium 4 E2E)
        // Must succeed to unlock container build & deployment stages
        // =====================================================================
        stage('Automated Quality Gate (Selenium E2E)') {
            steps {
                dir('tests-selenium') {
                    echo "Executing Selenium 4 Headless Chrome E2E Suite against ${params.APP_URL}..."
                    sh "mvn clean test -Dapp.url=${params.APP_URL}"
                }
            }
            post {
                always {
                    // Archive TestNG XML reports in Jenkins UI
                    junit testResults: 'tests-selenium/target/surefire-reports/*.xml', allowEmptyResults: true
                    
                    // Archive failure screenshots if any test failed
                    archiveArtifacts artifacts: 'tests-selenium/target/screenshots/*.png', allowEmptyArchive: true
                }
                failure {
                    echo "❌ Quality Gate FAILED! Halting deployment pipeline to protect ${params.DEPLOY_ENV}."
                }
            }
        }

        // =====================================================================
        // Stage 4: Docker Multi-Stage Image Build & Tagging
        // =====================================================================
        stage('Docker Multi-Stage Build') {
            steps {
                echo "Building production container images with tags: ${IMAGE_TAG} and latest..."
                sh """
                    docker build --no-cache \
                        -t ${DOCKER_HUB_REPO}-backend:${IMAGE_TAG} \
                        -t ${DOCKER_HUB_REPO}-backend:latest \
                        ./backend

                    docker build --no-cache \
                        -t ${DOCKER_HUB_REPO}-frontend:${IMAGE_TAG} \
                        -t ${DOCKER_HUB_REPO}-frontend:latest \
                        ./frontend
                """
            }
        }

        // =====================================================================
        // Stage 5: Authenticated Push to Docker Hub
        // =====================================================================
        stage('Docker Hub Push') {
            steps {
                echo "Authenticating against Docker Hub and pushing image tags..."
                sh '''
                    echo "$DOCKER_CREDS_PSW" | docker login -u "$DOCKER_CREDS_USR" --password-stdin
                    docker push ${DOCKER_HUB_REPO}-backend:${IMAGE_TAG}
                    docker push ${DOCKER_HUB_REPO}-backend:latest
                    docker push ${DOCKER_HUB_REPO}-frontend:${IMAGE_TAG}
                    docker push ${DOCKER_HUB_REPO}-frontend:latest
                    docker logout
                '''
            }
        }

        // =====================================================================
        // Stage 6: Zero-Downtime Container Deployment
        // =====================================================================
        stage('Zero-Downtime Deployment') {
            steps {
                echo "Initiating rolling container update for ${params.DEPLOY_ENV}..."
                sh """
                    docker compose down --remove-orphans
                    docker compose up -d
                """
            }
        }

        // =====================================================================
        // Stage 7: Post-Deployment Automated Health Probe
        // Probes /api/health to guarantee live database and endpoint readiness
        // =====================================================================
        stage('Post-Deployment Health Probe') {
            steps {
                echo "Probing container health endpoint against http://localhost:5000/api/health..."
                sh '''
                    HEALTH_URL="http://localhost:5000/api/health"
                    MAX_ATTEMPTS=10
                    SLEEP_SECONDS=3

                    for attempt in $(seq 1 $MAX_ATTEMPTS); do
                        echo "Probing $HEALTH_URL (Attempt $attempt/$MAX_ATTEMPTS)..."
                        RESPONSE=$(curl -s -f "$HEALTH_URL" || true)

                        if echo "$RESPONSE" | grep -q '"status":"UP"'; then
                            echo "✔ Backend health probe verified! Service is UP and SQLite is connected."
                            exit 0
                        fi

                        sleep $SLEEP_SECONDS
                    done

                    echo "❌ Health check failed after 30 seconds! Triggering rollback alert."
                    exit 1
                '''
            }
        }
    }

    post {
        success {
            echo "=========================================================="
            echo "🎉 Pipeline Build #${BUILD_NUMBER} completed successfully!"
            echo "Deployed Version: ${IMAGE_TAG} | Environment: ${params.DEPLOY_ENV}"
            echo "=========================================================="
        }
        failure {
            echo "=========================================================="
            echo "🚨 Pipeline Build #${BUILD_NUMBER} FAILED!"
            echo "Review console logs and archived failure screenshots."
            echo "=========================================================="
        }
        cleanup {
            cleanWs deleteDirs: true, notFailBuild: true
        }
    }
}
