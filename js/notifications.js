const Toast = Swal.mixin({
    toast: true,
    position: 'top',
    showConfirmButton: false,
    timer: 2000,
    timerProgressBar: true,
    didOpen: (toast) => {
        toast.addEventListener('mouseenter', Swal.stopTimer)
        toast.addEventListener('mouseleave', Swal.resumeTimer)
    }
});

class Notify {
    static success(message) {
        Toast.fire({
            icon: 'success',
            title: message
        });
    }

    static error(message) {
        Toast.fire({
            icon: 'error',
            title: message
        });
    }

}

