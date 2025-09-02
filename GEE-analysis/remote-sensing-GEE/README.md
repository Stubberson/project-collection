# GEE Self-study
Here's a few picks from the book Cloud-Based Remote Sensing with Google Earth Engine (2024) by Jeffrey A. Cardille, Morgan A. Crowley, David Saah, and Nicholas E. Clinton. I self studied the book for understanding remote sensing data better and having tools to do analysis on Google's vast dataset of satellite imagery.

The code snippets are as their own files and follow the book's exercises with minor changes in them.

## 1/2 Land Cover Classification
Supervised classification uses a training dataset with predefined and known labels (true values) to train a classifier. Here we used the Random Forest algorithm which works by constructing a multitude of decision trees.

Classification legend: Forest (dark green), Developed (white), Water (blue), Herbaceous (light green)

_Figure 1. Random forest land cover classification._
![random_forest_class](https://github.com/user-attachments/assets/12600629-62f0-4a8c-b1e1-25201e9e35a6)

## 2/2 Linear Regression in Remote Sensing
Regression works in a similar way in the context of remote sensing as it would in any other context: you fit a model (in this case a line) into a (set of) independent variable(s) to predict the value of a dependent variable. Here we used a spectral index NDVI to predict the percentage of tree cover in and around Turin, Italy.

_Figure 2. Tree cover percentage as the dependent variable._

<img width="736" height="541" alt="Screenshot 2025-09-02 at 20 22 03" src="https://github.com/user-attachments/assets/cffb5b65-f466-4e98-921e-231f69776a9a" />

_Figure 3. Predicted tree cover percentage for a larger area based on NDVI as the independent variable._

<img width="704" height="558" alt="Screenshot 2025-09-02 at 20 22 16" src="https://github.com/user-attachments/assets/1e2e8e1c-eed7-48ac-a2ab-908a03e97f7a" />
